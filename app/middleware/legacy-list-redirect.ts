/**
 * The former list pages, `/bookables` and `/events`, live on as redirects to
 * the Result Page. The query travels along, so a saved search keeps working,
 * and the events route adds its Kind to the `cat` facet. The tenant twins
 * inherit this middleware from the page meta, so `/t/<id>/events` lands on
 * `/t/<id>/search`.
 *
 * A route middleware rather than a Nitro route rule: the client-side manifest
 * redirect drops the query on in-app navigations. 302 while the path is new;
 * browsers cache a 301.
 */
export default defineNuxtRouteMiddleware((to) => {
  const tenantID = to.params.tenantID as string | undefined;
  const path = tenantID ? `/t/${tenantID}/search` : "/search";

  const query: Record<string, unknown> = { ...to.query };
  if (/\/events\/?$/.test(to.path)) {
    const cats = String(query.cat ?? "")
      .split(",")
      .filter(Boolean);
    if (!cats.includes("event")) cats.push("event");
    query.cat = cats.join(",");
  }

  return navigateTo(
    { path, query, hash: to.hash },
    { redirectCode: 302, replace: true },
  );
});
