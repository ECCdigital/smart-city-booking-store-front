import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const { data, error } = await serverFetch(event, `/api/catalog/public`, {
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
