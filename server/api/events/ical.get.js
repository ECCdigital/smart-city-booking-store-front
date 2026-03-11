import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getQuery(event).tenantId;
  const eventId = getQuery(event).eventId;
  console.log("Received request for iCal download with event ID:", eventId);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/events/${eventId}/ical`,
    {
      method: "GET",
    },
  );

  if (error) {
    console.error("Error fetching iCal data:", error);
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch iCal data",
      data: error.message,
    });
  }
  console.log("*iCal data fetched successfully:", data);
  return data;
});
