import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

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
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch event data",
      data: error.message,
    });
  }
  return data;
});
