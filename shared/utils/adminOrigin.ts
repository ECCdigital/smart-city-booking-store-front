/**
 * The origin the admin UI is served from, read from `NUXT_PUBLIC_ADMIN_BASE_URL`.
 *
 * The Hero's Live Preview trusts exactly this origin: the storefront lets it
 * frame the preview route and, in the browser, accepts Draft messages from it
 * and nowhere else. It is the same value in both places on purpose — one
 * variable, one origin, never a wildcard.
 *
 * @param baseUrl - The configured admin base URL; may carry a path or hash.
 * @returns The origin (`scheme://host[:port]`) or `null` when the variable is
 *   unset, blank or not an http(s) URL — which disables the preview outright.
 */
export function adminOrigin(baseUrl: unknown): string | null {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    return null;
  }

  let url: URL;
  try {
    url = new URL(baseUrl.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }

  return url.origin;
}
