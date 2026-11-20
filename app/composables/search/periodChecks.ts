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
  | "pubEv"
  | "regEv"
  | "cat"
  | "cities"
  | "tenants"
  | "customFields"
  | "distance"
>;

/**
 * The ids of the Offers the active filters keep. Only these are worth an
 * availability or price request: the rest are hidden by the filters anyway.
 * Price and distance are left out, the one needs the price this check
 * fetches, the other was settled by the location search: an Offer outside
 * the radius is never asked about, so a wider radius needs a new search
 * (`narrowingKey`).
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
    criteria.distance ?? null,
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
 * Whether a failed period request means the backend has no such route (an
 * older backend): `404`/`405` without an error code of the backend, whose
 * router answers an unknown path with a plain page. Only then are single
 * requests worth it. Any other failure, a `429` above all, must not fan
 * out into two requests per Offer; a `404 tenant_not_found` carries a code.
 */
export function isMissingPeriodRoute(error: unknown): boolean {
  const { statusCode, data } = (error ?? {}) as {
    statusCode?: number;
    data?: unknown;
  };
  if (statusCode !== 404 && statusCode !== 405) return false;
  const code =
    data && typeof data === "object" && "code" in data
      ? (data as { code?: unknown }).code
      : undefined;
  return !code;
}

/** One bookable as the backend's period request answers it. */
export interface PeriodOccupancy {
  bookableId: string;
  isAvailable: boolean;
  /** The check that refused, or `error` where the checks could not run. */
  reason?: string;
  price?: { userGrossPriceEur: number } | null;
}

/**
 * What the search keeps of one bookable of a period request. Left out of
 * the answer, it is out of reach and not available. `error` says nothing
 * about the period: `isAvailable` is `null`, unknown, as after a failed
 * request. No price is asked again, the backend answered.
 */
export function periodResultOf(answer: PeriodOccupancy | undefined): {
  isAvailable: boolean | null;
  price: { userGrossPriceEur: number } | null;
} {
  if (!answer) return { isAvailable: false, price: null };
  if (answer.reason === "error") return { isAvailable: null, price: null };
  return { isAvailable: answer.isAvailable, price: answer.price ?? null };
}

/**
 * What one period check says about an Offer: `true` available, `false` not,
 * and `null` or `undefined` (the check failed or could not run) unchecked.
 * An unchecked Offer stays in the list, marked: neither shown as available
 * nor hidden as booked, since nothing is known about the period.
 */
export function availabilityOf(
  result: boolean | null | undefined,
): "available" | "unavailable" | "unchecked" {
  if (result === true) return "available";
  if (result === false) return "unavailable";
  return "unchecked";
}

/**
 * The place a re-run of the search (a changed filter, a reloaded list)
 * searches around: the one the last run used, coordinates and all, as long
 * as it is still the place of the query. Geocoding its display text again
 * could land elsewhere or nowhere, and costs a call to the geocoder.
 */
export function locationForRerun<L extends { display_address?: string }>(
  lastLocation: string | L | null | undefined,
  queryLocation: string,
): string | L {
  if (
    lastLocation &&
    typeof lastLocation === "object" &&
    queryLocation &&
    lastLocation.display_address === queryLocation
  ) {
    return lastLocation;
  }
  return queryLocation;
}

/**
 * Which search run may still write its results. `start` hands a run its
 * token; a later `start` or an `invalidate` (a reset, a rebuild of the list)
 * outdates it, so a run still waiting for the backend cannot bring back a
 * period that is no longer chosen.
 */
export function createRunGuard() {
  let latest = 0;
  return {
    start: () => ++latest,
    invalidate: () => {
      latest++;
    },
    isCurrent: (run: number) => run === latest,
  };
}

/**
 * Remembers one answer per key, so a re-run with the same period, a widened
 * filter or a second search on the same page asks only for what is new. An
 * answer is kept from the moment it is asked for, so a request on its way
 * is shared too. A failed request is forgotten and asked again next time;
 * with `ttlMs`, an answer is forgotten once it is that old, since bookings
 * go on while the page stays open.
 */
export function createRequestCache({
  ttlMs = Infinity,
  now = () => Date.now(),
}: { ttlMs?: number; now?: () => number } = {}) {
  const entries = new Map<string, { promise: Promise<unknown>; at: number }>();

  function fresh(key: string) {
    const entry = entries.get(key);
    if (!entry) return undefined;
    if (now() - entry.at >= ttlMs) {
      entries.delete(key);
      return undefined;
    }
    return entry;
  }

  function cached<R>(key: string, request: () => Promise<R>) {
    const hit = fresh(key);
    if (hit) return hit.promise as Promise<R>;

    const pending = request().catch((error) => {
      if (entries.get(key)?.promise === pending) entries.delete(key);
      throw error;
    });
    entries.set(key, { promise: pending, at: now() });
    return pending;
  }

  return Object.assign(cached, {
    /** Whether an answer for the key is kept or on its way. */
    has: (key: string) => fresh(key) !== undefined,
  });
}

/**
 * How long the search keeps an answer about availability and price: long
 * enough to share it between the searches of one page and its re-runs,
 * short enough that a booking made meanwhile shows on the next search.
 */
export const PERIOD_CACHE_TTL_MS = 60_000;
