import { serverFetch } from "../../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  const processId = getRouterParam(event, "processId");

  console.log("Received request to open mobile key for booking:", {
    tenantID,
    bookingId,
    processId,
  });

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/mobile-key/${processId}/open`,
    {
      method: "POST",
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to open mobile key",
      data: error.message,
    });
  }

  console.log("Mobile key opened successfully:", data);

  return data;
});