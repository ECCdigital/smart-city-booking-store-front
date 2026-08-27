/**
 * What a media delivery URL looks like — shared by the client, which decides
 * whether it may ask for a size preset, and by the `/api/img` proxy, which
 * decides whether the response carries backend cache headers worth passing on.
 * Both answers have to agree, so the rule lives in one place.
 */

/**
 * The delivery route of the backend's media library: relative, scoped to a
 * tenant or to the instance (`/api/v2/instance/...`).
 */
const MEDIA_FILE_PATH = /^\/api\/v2\/[^/]+\/media\/[^/]+\/file$/;

/**
 * Whether a path belongs to our own media library, and therefore understands
 * `?size=` presets and emits cache headers we control.
 *
 * @param pathname - Path of the URL, without query or host.
 */
export function isMediaFilePath(pathname: string): boolean {
  return MEDIA_FILE_PATH.test(pathname);
}

/**
 * The same question for a URL that may still carry a query string.
 *
 * @param url - A relative media URL as the backend exports it.
 */
export function isMediaFileUrl(url: string): boolean {
  const [pathname] = url.split("?");
  return isMediaFilePath(pathname ?? "");
}
