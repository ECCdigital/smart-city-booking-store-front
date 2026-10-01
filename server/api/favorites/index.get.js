import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

// The references of the signed-in user's favorites, across every tenant or
// narrowed to one with `?tenant=`. Private to the session, so never cached.
export default defineEventHandler(async (event) => {
  const { tenant } = getQuery(event);

  const { data, error } = await serverFetch(event, "/api/v2/favorites", {
    method: "GET",
    query: tenant ? { tenant } : undefined,
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch favorites",
      data: error.data,
    });
  }

  return data;
});
