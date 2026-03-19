import { serverFetch } from "../../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  const openBoxId = getRouterParam(event, "processId");

  console.log("Received request to check mobile key status for booking:", {
    tenantID,
    bookingId,
    openBoxId,
  });

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/access/${openBoxId}/open-status`,
    {
      method: "GET",
      query: { openBoxId },
    },
  );

  console.log("Response from access open-status API:", { data, error });

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to check mobile key status",
      data: error.message,
    });
  }

  console.log("Mobile key status checked successfully:", data);

  return data;
});
