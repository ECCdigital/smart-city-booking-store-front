import { serverFetch } from "../../../../../utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  const processId = getRouterParam(event, "processId");
  const { openBoxId } = getQuery(event);

  const { data, error } = await serverFetch(
    event,
    `/api/${tenantID}/bookings/${bookingId}/access/${processId}/open-status`,
    {
      method: "GET",
      query: { openBoxId },
    }
  );


  if (error) {
    throw createError({
      statusCode: error.status || 500,
      statusMessage: "Failed to check mobile key status",
      data: error.message,
    });
  }

  return data;
});
