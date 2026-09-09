import { getThemeView } from "~~/server/api/utils/themeBundle";
import { quoteEtag } from "~~/server/utils/themeBundleStore";

/**
 * The one route the storefront reads its look from.
 *
 * It answers with a Theme View and nothing else: the Portal Name, a validated
 * and sanitised Hero Layout, the Background and the logo reference. The
 * backend URLs, the colours and the visibility of the raw Theme Bundle stay on
 * the server — the colours are served as CSS by the stylesheet routes.
 *
 * There is no cached handler around it. Freshness is the store's business
 * (storefront ADR 0001), and the response carries the bundle's own strong etag
 * so a client that already holds this theme revalidates into a 304.
 */
export default defineEventHandler(async (event) => {
  const { slug } = getQuery(event);
  const view = await getThemeView(event, slug ? String(slug) : null);

  const etag = quoteEtag(view.etag);
  setHeader(event, "ETag", etag);
  setHeader(event, "Cache-Control", "no-cache");

  if (getHeader(event, "if-none-match") === etag) {
    setResponseStatus(event, 304);
    return null;
  }

  return view;
});
