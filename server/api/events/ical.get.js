import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getQuery(event).tenantId;
  const eventId = getQuery(event).eventId;

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/ical/events/${eventId}`,
    {
      method: "GET",
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch iCal data",
      data: error.message,
    });
  }
  return data;
});
