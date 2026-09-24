/**
 * Tenant supervision: a tenant can stop being public (pending approval or
 * declined) and an offer's approval can be withdrawn at any time, and the next
 * request has to show it. The proxy
 * answers below carry such a release, so no browser, CDN or reverse proxy may
 * store them.
 *
 * Deliberately not listed: `/api/theme/**` and `/api/img` answer with cache
 * headers of their own (versioned assets, the backend's media policy), and
 * `/api/catalog/mode` carries no release and is answered from the server-side
 * cache, which writes its own `Cache-Control`.
 */
const RELEASE_SENSITIVE_PREFIXES = [
  "/api/catalog",
  "/api/tenants",
  "/api/bookables",
  "/api/events",
  "/api/checkout",
];

const RELEASE_FREE_PATHS = ["/api/catalog/mode"];

export const NO_STORE = "no-store";

/**
 * Whether the answer to a request path carries a tenant or offer release.
 *
 * @param path - The request path; a query string is ignored.
 */
export function isReleaseSensitivePath(path: string): boolean {
  const pathname = path.split("?")[0] ?? "";
  if (RELEASE_FREE_PATHS.includes(pathname)) return false;
  return RELEASE_SENSITIVE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
