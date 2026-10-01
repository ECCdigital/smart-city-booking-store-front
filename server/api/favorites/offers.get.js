import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

// The hydrated entries of the signed-in user's favorites list, each with its
// state (`available`, `unavailable`, `deleted`), the snapshot of title and
// tenant name, and the offer in its public projection where available.
// Across every tenant or narrowed to one with `?tenant=`. Private to the
// session, so never cached.
export default defineEventHandler(async (event) => {
  const { tenant } = getQuery(event);

  const { data, error } = await serverFetch(event, "/api/v2/favorites/offers", {
    method: "GET",
    query: tenant ? { tenant } : undefined,
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch favorite offers",
      data: error.data,
    });
  }

  return data;
});
