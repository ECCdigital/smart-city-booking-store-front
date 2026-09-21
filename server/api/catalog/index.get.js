import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const { data, error } = await serverFetch(event, `/api/catalog/public`, {
    method: "GET",
  });

  if (error) {
    throw createError(proxyErrorOf(error, "Failed to fetch catalog"));
  }

  return data;
});
