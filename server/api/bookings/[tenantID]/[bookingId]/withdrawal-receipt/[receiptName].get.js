import { serverFetch } from "../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  // The file name of the booking's attachment of type `withdrawal`.
  const receiptName = getRouterParam(event, "receiptName");

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/withdrawal-receipt/${receiptName}`,
    {
      method: "GET",
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch booking withdrawal receipt",
      data: error.message,
    });
  }

  return data;
});
