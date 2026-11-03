/**
 * A page of the storefront under its public base URL, for links that leave
 * the storefront in a mail: the reset page of forgot password, the verify
 * page of signup and the card link page (ECCdigital/tickets#554).
 *
 * `NUXT_USER_BASE_URL` / `NUXT_PUBLIC_USER_BASE_URL` may end in "/". Joined
 * as is, the link reads "https://host//password/reset", and the client router
 * sends that to the start page, losing token and address. So the base URL's
 * trailing slashes go, and exactly one slash joins it to the path.
 *
 * @param baseUrl - The configured base URL; may carry a base path.
 * @param path - The page path with a leading "/", language prefix included.
 * @returns The absolute link, or the bare path when no base URL is set.
 */
export function storefrontUrl(baseUrl: unknown, path: string): string {
  const base = typeof baseUrl === "string" ? baseUrl.trim() : "";
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}
