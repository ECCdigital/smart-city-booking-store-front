---
status: accepted
date: 2026-09-08
---

# Theme Bundle freshness by ETag revalidation, not by a purge endpoint

The storefront caches the theme routes (`/api/theme/*`) for 300 s in a per-process in-memory Nitro cache. An admin save of the Hero Layout, Background or Portal Name has to show up on the public site within seconds. We revalidate instead of purging: the backend serves `GET /api/catalog/themes[/:slug]` with a strong `ETag` (content hash of the exported Theme Bundle) and answers `If-None-Match` with 304; the storefront keeps the bundle per process and revalidates at most every 5 s (`NUXT_THEME_REVALIDATE_SECONDS`, `0` = every request), serving the stale copy when the backend is unreachable. Derived assets (CSS, logo, favicon) carry `?v=<etag>` in their URLs and are cached as immutable.

## Considered options

- **Push purge** (backend calls `POST /api/internal/purge` on the storefront after a save): needs the storefront URL and a shared secret in both repos, a new authenticated endpoint, and reaches only one replica unless the Nitro cache moves to Redis. Rejected.
- **Shorter TTL only**: cheap but still visibly stale, and stale-while-revalidate serves the old copy once more after expiry. Rejected.
- **ETag revalidation** (chosen): no configuration, no secret, no URL knowledge, works for any number of replicas without shared infrastructure. Costs one conditional request per page view and replica at most every 5 s.

## Consequences

- Anything that determines the look of the site travels only in the Theme Bundle; the catalog bundle (cached 300 s per auth scope) must not carry theme data.
- The backend must invalidate its cached export on every write path that changes the bundle (`PUT /api/instances`, `PUT /api/catalog`, tenant catalog updates for slug exports).
- A CDN or reverse-proxy cache in front of the storefront is not invalidated by this mechanism; versioned asset URLs limit the effect to the HTML page itself.
