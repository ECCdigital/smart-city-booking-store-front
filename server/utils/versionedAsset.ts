import type { H3Event } from "h3";

/** A year, the longest `max-age` HTTP asks caches to honour. */
const IMMUTABLE = "public, max-age=31536000, immutable";

/** What the theme assets answered before they were versioned. */
const REVALIDATING = "public, max-age=300, s-maxage=300";

/**
 * Answers the caching half of a theme asset request.
 *
 * The document head links these assets with `?v=<etag>` (storefront ADR 0001),
 * which makes the URL change whenever the Theme Bundle changes. A request that
 * carries the version can therefore be cached for as long as a cache likes;
 * one that does not — a bookmark, a crawler, a hand-typed URL — keeps the
 * short lifetime and the conditional revalidation the routes had before they
 * were versioned.
 *
 * @param event - The request being answered.
 * @param etag - The current bundle etag, or `null` when none is known.
 * @returns `true` when the request has been answered with a 304 and the caller
 *   should return without a body.
 */
export function serveVersionedAsset(event: H3Event, etag: string | null): boolean {
  const versioned = Boolean(getQuery(event).v);

  setHeader(event, "Cache-Control", versioned ? IMMUTABLE : REVALIDATING);
  if (!etag) return false;

  const quoted = `"${etag}"`;
  setHeader(event, "ETag", quoted);

  if (getHeader(event, "if-none-match") === quoted) {
    setResponseStatus(event, 304);
    return true;
  }
  return false;
}
