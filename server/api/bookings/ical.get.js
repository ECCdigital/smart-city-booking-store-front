import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getQuery(event).tenantId;
  const bookingId = getQuery(event).bookingId;
  console.log("Received request for iCal download with bookingId:", bookingId);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/ical`,
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
  console.log("#iCal data fetched successfully:", data);
  return data;
});
