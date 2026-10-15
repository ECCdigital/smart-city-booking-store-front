import { getThemeEntry } from "~~/server/api/utils/themeBundle";
import { themeFontFileUrl } from "~~/server/utils/themeFont";
import { loadThemeFont } from "~~/server/utils/themeFontFile";
import { serveUncached, serveVersionedAsset } from "~~/server/utils/versionedAsset";

/**
 * The instance font when it is a font of the media library
 * (ECCdigital/tickets#531). Like the favicon it is served from the
 * storefront's own origin, so the browser never asks the backend for it and
 * neither CORS nor the CSP have to change. Versioned with `?v=<etag>`, it is
 * cached for good; a new font comes with a new etag and so a new URL.
 *
 * The curated fonts are not served here but as files under `/fonts/`.
 */
export default defineEventHandler(async (event) => {
  const entry = await getThemeEntry(event);

  if (!themeFontFileUrl(entry?.bundle?.font)) {
    throw createError({ statusCode: 404, statusMessage: "No instance font" });
  }

  if (serveVersionedAsset(event, entry?.etag ?? null)) return null;

  const loaded = await loadThemeFont(entry);
  if (!loaded?.bytes) {
    serveUncached(event);
    throw loaded
      ? createError({ statusCode: 404, statusMessage: "The instance font is no woff2 font" })
      : createError({ statusCode: 502, statusMessage: "The instance font could not be loaded" });
  }

  setHeader(event, "Content-Type", "font/woff2");
  return loaded.bytes;
});
