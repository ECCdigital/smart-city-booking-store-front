import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");

  const { data, error } = await serverFetch(
    event,
    `/json/${tenantID}/bookables/`,
    {
      method: "GET",
    }
  );
  if (error) {
    throw createError(proxyErrorOf(error, "Failed to fetch bookables"));
  }

  return data;
});
