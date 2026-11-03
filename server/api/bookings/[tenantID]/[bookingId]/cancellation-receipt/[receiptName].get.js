import { serverFetch } from "../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  // The file name of the booking's attachment of type `cancellation`.
  const receiptName = getRouterParam(event, "receiptName");

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/cancellation-receipt/${receiptName}`,
    {
      method: "GET",
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch booking cancellation receipt",
      data: error.message,
    });
  }

  return data;
});
