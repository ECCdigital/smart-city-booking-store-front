import { getThemeEntry } from "~~/server/api/utils/themeBundle.ts";
import { renderThemeCss } from "~~/server/utils/themeCss";
import { serveVersionedAsset } from "~~/server/utils/versionedAsset";

const defaultTheme = {
  primary: "#FF8B00",
  secondary: "#1D9ECC",
};

/**
 * The instance stylesheet. It renders straight from the Theme Bundle instead
 * of sitting behind a cached handler of its own: the bundle's store decides
 * how fresh the colours are, and the render is memoised per etag.
 */
export default defineEventHandler(async (event) => {
  const entry = await getThemeEntry(event);

  setHeader(event, "Content-Type", "text/css");
  if (serveVersionedAsset(event, entry?.etag ?? null)) return null;

  return renderThemeCss({
    etag: entry?.etag ?? "default",
    colors: entry?.bundle?.theme?.colors,
    defaults: defaultTheme,
  });
});
