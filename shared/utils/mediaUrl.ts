/**
 * What a media delivery URL looks like — shared by the client, which decides
 * whether it may ask for a size preset, and by the `/api/img` proxy, which
 * decides whether the response carries backend cache headers worth passing on.
 * Both answers have to agree, so the rule lives in one place.
 */

/**
 * The delivery route of the backend's media library, scoped to a tenant or to
 * the instance (`/api/v2/instance/...`).
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
 * The same question for a full URL. The backend exports media addresses
 * relative on most routes and absolute on the embed interfaces the storefront
 * reads (`/json/...`), so both forms have to be recognized — the route's path
 * shape is the stable part of the contract, not the host.
 *
 * @param url - A media URL as the backend exports it, relative or absolute,
 *   with or without a query string.
 */
export function isMediaFileUrl(url: string): boolean {
  let pathname: string;

  try {
    pathname = new URL(url, "http://relative.invalid").pathname;
  } catch {
    return false;
  }

  return isMediaFilePath(pathname);
}
