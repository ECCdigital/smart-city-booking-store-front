import {
  applyCatalogFilters,
  MatchStatus,
  type CatalogFilterCriteria,
  type FilterableItem,
} from "~/composables/search/catalogFilters";

/**
 * How many availability, price and ticket requests one search keeps in
 * flight. The browser runs about six per host anyway; more only queue, and
 * the BFF counts every one against the visitor's rate limit.
 */
export const PERIOD_CHECK_CONCURRENCY = 6;

/**
 * Runs `fn` over `items` with at most `limit` calls in flight and returns the
 * results in the order of `items`. A call that rejects yields `undefined` in
 * its place and leaves the others running.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<(R | undefined)[]> {
  const results: (R | undefined)[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index] as T, index);
      } catch {
        results[index] = undefined;
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(Math.max(limit, 1), items.length) },
    () => worker(),
  );
  await Promise.all(workers);
  return results;
}

/** The filters that narrow which Offers a search asks the backend about. */
export type NarrowingCriteria = Pick<
  CatalogFilterCriteria,
  "pubEv" | "regEv" | "cat" | "cities" | "tenants" | "customFields"
>;

/**
 * The ids of the Offers the active filters keep. Only these are worth an
 * availability or price request: the rest are hidden by the filters anyway.
 * Price and distance are left out, the one needs the price this check
 * fetches, the other was settled by the location search.
 */
export function idsToCheck<T extends FilterableItem>(
  items: T[],
  criteria: NarrowingCriteria,
): Set<string> {
  const filtered = applyCatalogFilters(
    items,
    {
      ...criteria,
      inclNoSuitable: false,
      distance: null,
      hasLocation: false,
      price: [],
    },
    { getMinPrice: () => null },
  );
  return new Set(
    filtered
      .filter((w) => w.matchStatus === MatchStatus.MATCH)
      .map((w) => w.item.id),
  );
}

/**
 * A stable key of the narrowing filters: when it changes during a period
 * search, Offers that were skipped may now need a check.
 */
export function narrowingKey(criteria: NarrowingCriteria): string {
  return JSON.stringify([
    criteria.pubEv,
    criteria.regEv,
    [...(criteria.cat ?? [])].sort(),
    [...(criteria.cities ?? [])].sort(),
    [...(criteria.tenants ?? [])].sort(),
    Object.entries(criteria.customFields ?? {}).sort(([a], [b]) =>
      a.localeCompare(b),
    ),
  ]);
}

/** How many bookables the backend takes in one period request. */
export const PERIOD_BATCH_SIZE = 100;

/**
 * The period requests for a list of bookables: one per tenant, split where
 * a tenant has more than `size`, ids in the order given.
 */
export function periodBatches(
  items: readonly { id: string; tenantId: string }[],
  size = PERIOD_BATCH_SIZE,
): { tenantId: string; ids: string[] }[] {
  const byTenant = new Map<string, string[]>();
  for (const { id, tenantId } of items) {
    const ids = byTenant.get(tenantId) ?? [];
    if (!ids.includes(id)) ids.push(id);
    byTenant.set(tenantId, ids);
  }

  const batches: { tenantId: string; ids: string[] }[] = [];
  for (const [tenantId, ids] of byTenant) {
    for (let i = 0; i < ids.length; i += size) {
      batches.push({ tenantId, ids: ids.slice(i, i + size) });
    }
  }
  return batches;
}

/**
 * Remembers one answer per key for the lifetime of a search component, so a
 * re-run with the same period or a widened filter asks only for what is new.
 * A failed request is forgotten and asked again next time.
 */
export function createRequestCache() {
  const entries = new Map<string, Promise<unknown>>();

  function cached<R>(key: string, request: () => Promise<R>) {
    const hit = entries.get(key) as Promise<R> | undefined;
    if (hit) return hit;

    const pending = request().catch((error) => {
      entries.delete(key);
      throw error;
    });
    entries.set(key, pending);
    return pending;
  }

  return Object.assign(cached, {
    /** Whether an answer for the key is kept or on its way. */
    has: (key: string) => entries.has(key),
  });
}
