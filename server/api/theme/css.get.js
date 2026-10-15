import { getThemeEntry } from "~~/server/api/utils/themeBundle.ts";
import { renderThemeCss } from "~~/server/utils/themeCss";
import { loadThemeFont } from "~~/server/utils/themeFontFile";
import { serveUncached, serveVersionedAsset } from "~~/server/utils/versionedAsset";

const defaultTheme = {
  primary: "#FF8B00",
  secondary: "#1D9ECC",
};

/**
 * The instance stylesheet. It renders straight from the Theme Bundle instead
 * of sitting behind a cached handler of its own: the bundle's store decides
 * how fresh the colours are, and the render is memoised per etag.
 *
 * It also carries the instance font (ECCdigital/tickets#531). An uploaded
 * font that cannot be fetched leaves the system font for this answer only,
 * which is therefore not cached.
 */
export default defineEventHandler(async (event) => {
  const entry = await getThemeEntry(event);

  setHeader(event, "Content-Type", "text/css");
  if (serveVersionedAsset(event, entry?.etag ?? null)) return null;

  const font = await loadThemeFont(entry);
  if (!font) serveUncached(event);

  return renderThemeCss({
    etag: entry?.etag ?? "default",
    colors: entry?.bundle?.theme?.colors,
    header: entry?.bundle?.header,
    defaults: defaultTheme,
    font: font?.font,
  });
});
