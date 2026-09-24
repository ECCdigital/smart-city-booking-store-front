import { getThemeEntry } from "~~/server/api/utils/themeBundle.ts";
import { renderThemeCss } from "~~/server/utils/themeCss";
import { serveVersionedAsset } from "~~/server/utils/versionedAsset";

const defaultTheme = {
  primary: "#3b82f6",
  secondary: "#10b981",
};

/** The stylesheet of one catalog slug. See `css.get.js` for the caching. */
export default defineEventHandler(async (event) => {
  // The slug sits in the file name of the path, not in a whole segment, so it
  // is read from the URL rather than from a router param. The versioned link
  // appends `?v=<etag>`, which must not become part of the slug.
  const path = (event.path || event.node?.req?.url || "").split("?")[0];
  const slug = path.split("/").pop()?.replace(/\.css$/, "") || "";

  const entry = await getThemeEntry(event, slug);

  setHeader(event, "Content-Type", "text/css");
  if (serveVersionedAsset(event, entry?.etag ?? null)) return null;

  return renderThemeCss({
    etag: entry?.etag ?? "default",
    colors: entry?.bundle?.theme?.colors,
    defaults: defaultTheme,
  });
});
