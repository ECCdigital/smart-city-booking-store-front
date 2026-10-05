import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const eventID = getRouterParam(event, "eventID");

  const { data, error } = await serverFetch(
    event,
    `/json/${tenantID}/events/${eventID}`,
    {
      method: "GET",
    },
  );

  if (error) {
    throw createError(proxyErrorOf(error, "Failed to fetch event data"));
  }
  return data;
});
