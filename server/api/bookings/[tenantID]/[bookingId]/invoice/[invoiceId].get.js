import { serverFetch } from "../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  const invoiceId = getRouterParam(event, "invoiceId");

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/invoice/${invoiceId}`,
    {
      method: "GET",
    },
  );

  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to fetch booking receipt",
      data: error.message,
    });
  }

  return data;
});
