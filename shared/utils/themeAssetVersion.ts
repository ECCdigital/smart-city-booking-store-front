/**
 * The revision of what the storefront renders from a Theme Bundle. Raise it
 * whenever a release changes the output for the same bundle (the stylesheet's
 * contrast colours, for one): the theme assets are cached as immutable under
 * `?v=<version>` (storefront ADR 0001), so without a new version a browser
 * keeps the old rendering for as long as the instance colours stay the same.
 */
export const THEME_RENDER_REVISION = 2;

/**
 * @param etag - The Theme Bundle's etag.
 * @returns The version of the theme assets: the bundle's etag together with
 *   the render revision. It goes into the asset URLs and their `ETag`.
 */
export function themeAssetVersion(etag: string): string {
  return `${etag}.r${THEME_RENDER_REVISION}`;
}
