/**
 * The storefront's single revalidation point for the Theme Bundle.
 *
 * Freshness is pull-based: the backend serves the bundle with a strong ETag,
 * and this store holds one entry per catalog slug for the lifetime of the
 * process, asking the backend with a conditional GET at most once per
 * revalidation interval. An admin save therefore reaches the public site
 * within that interval without any purge endpoint, shared secret or knowledge
 * of the storefront's URL — see storefront ADR 0001.
 *
 * Two properties matter beyond the caching:
 *
 * - **Concurrent requests share one revalidation.** A burst of page views
 *   after the interval expires costs the backend one conditional GET, not one
 *   per request.
 * - **A failing backend never blanks the site.** The stored copy is served
 *   for as long as the backend stays unreachable, and the failure is logged
 *   once per series rather than once per request.
 *
 * The module owns no I/O of its own: the fetcher, the view builder, the clock
 * and the logger are injected, which is also what makes it unit-testable
 * without booting Nitro.
 */

import type { ThemeBundle } from "~~/shared/types/api";
import type { ThemeView } from "~~/shared/types/hero";

/** What one conditional GET reported. */
export type ThemeBundleFetchResult =
  | { status: "modified"; bundle: ThemeBundle; etag: string }
  | { status: "not-modified" };

/**
 * Performs one conditional GET. It receives the stored etag for
 * `If-None-Match` and a signal that is aborted once the store stops waiting;
 * it reports failure by rejecting, ideally with a `status` on the error.
 */
export type ThemeBundleFetch = (input: {
  slug: string | null;
  etag: string | null;
  signal: AbortSignal;
}) => Promise<ThemeBundleFetchResult>;

/** What a reader gets back: the raw bundle, its etag and the Theme View. */
export interface ThemeBundleEntry {
  bundle: ThemeBundle;
  etag: string;
  view: ThemeView;
}

export interface ThemeBundleStoreOptions {
  fetchBundle: ThemeBundleFetch;
  buildView: (bundle: ThemeBundle, etag: string) => ThemeView;
  /** Seconds between conditional GETs per slug; `0` revalidates every read. */
  revalidateSeconds: number;
  /** How long one conditional GET may take before the stored copy wins. */
  timeoutMs: number;
  now?: () => number;
  logger?: { warn: (message: string) => void };
}

/** One slug's slot in the store. */
interface Slot {
  entry: ThemeBundleEntry | null;
  checkedAt: number;
  /** Shared by every reader that arrives while a revalidation is running. */
  inflight: Promise<ThemeBundleEntry | null> | null;
  /**
   * Identifies the current run of failures, so a backend that has been down
   * for an hour is one log line rather than thousands. `null` while healthy.
   */
  errorSeries: string | null;
}

/** The catalog named in a log line when the request carried no slug. */
const INSTANCE_CATALOG = "instance catalog";

/**
 * Strips the transport syntax from an `ETag` header — the quotes every strong
 * validator carries, and the `W/` of a weak one — because the storefront uses
 * the value as a query parameter on the versioned asset URLs, where quotes
 * have no business being.
 */
function bareEtag(header: string): string {
  return header.replace(/^W\//, "").replace(/^"|"$/g, "");
}

/** The form an etag takes on the wire, in `If-None-Match` and in `ETag`. */
export function quoteEtag(etag: string): string {
  return `"${etag}"`;
}

export function createThemeBundleStore(options: ThemeBundleStoreOptions) {
  const {
    fetchBundle,
    buildView,
    revalidateSeconds,
    timeoutMs,
    now = Date.now,
    logger,
  } = options;

  const slots = new Map<string, Slot>();

  function slotFor(slug: string | null): Slot {
    const key = slug ?? "";
    let slot = slots.get(key);
    if (!slot) {
      slot = { entry: null, checkedAt: 0, inflight: null, errorSeries: null };
      slots.set(key, slot);
    }
    return slot;
  }

  function isStale(slot: Slot): boolean {
    if (!slot.entry && slot.checkedAt === 0) return true;
    if (revalidateSeconds <= 0) return true;
    return now() - slot.checkedAt >= revalidateSeconds * 1000;
  }

  function reportFailure(slug: string | null, error: unknown) {
    const status =
      (error as { status?: number; statusCode?: number })?.status ??
      (error as { statusCode?: number })?.statusCode ??
      "no response";
    const series = String(status);
    const slot = slotFor(slug);
    if (slot.errorSeries === series) return;

    slot.errorSeries = series;
    logger?.warn(
      `Theme Bundle for ${slug ?? INSTANCE_CATALOG} could not be revalidated ` +
        `(${series}); serving the stored copy`,
    );
  }

  /**
   * Runs one conditional GET, bounded by the timeout. The abort is what stops
   * a hanging backend from holding a socket for the rest of the process; the
   * race is what stops it from holding the page render.
   */
  async function revalidate(slug: string | null): Promise<ThemeBundleEntry | null> {
    const slot = slotFor(slug);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const result = await Promise.race([
        fetchBundle({
          slug,
          etag: slot.entry ? quoteEtag(slot.entry.etag) : null,
          signal: controller.signal,
        }),
        new Promise<never>((_resolve, reject) => {
          controller.signal.addEventListener("abort", () => {
            reject(new Error(`Theme Bundle revalidation timed out after ${timeoutMs}ms`));
          });
        }),
      ]);

      if (result.status === "modified") {
        const etag = bareEtag(result.etag);
        slot.entry = {
          bundle: result.bundle,
          etag,
          view: buildView(result.bundle, etag),
        };
      }
      slot.errorSeries = null;
    } catch (error) {
      reportFailure(slug, error);
    } finally {
      clearTimeout(timer);
      controller.abort();
      // Even a failed attempt counts as a check: the interval is what stops a
      // storefront under load from retrying a dead backend on every request.
      slot.checkedAt = now();
      slot.inflight = null;
    }

    return slot.entry;
  }

  return {
    /**
     * The bundle for one catalog, revalidated if the interval has passed.
     *
     * @param slug - The catalog slug, or `null` for the instance catalog.
     * @returns The entry, or `null` while nothing has ever been read.
     */
    async get(slug: string | null = null): Promise<ThemeBundleEntry | null> {
      const slot = slotFor(slug);
      if (slot.inflight) return slot.inflight;
      if (!isStale(slot)) return slot.entry;

      slot.inflight = revalidate(slug);
      return slot.inflight;
    },
  };
}

export type ThemeBundleStore = ReturnType<typeof createThemeBundleStore>;
