import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, "slug");

  const { data, error } = await serverFetch(event, `/api/catalog/${slug}`, {
    method: "GET",
  });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch catalog",
      data: error.message,
    });
  }

  return data;
});
