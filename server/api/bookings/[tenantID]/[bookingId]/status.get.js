import { serverFetch } from "~~/server/api/utils/serverFetch.ts";

export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");

  const bookingIds = Array.isArray(bookingId) ? bookingId.join(",") : bookingId;

  const { data, error } = await serverFetch(
    event,
    `/api/v2/${encodeURIComponent(
      tenantID
    )}/bookings/${encodeURIComponent(bookingIds)}/status`,
    { method: "GET" }
  );

  if (error) {
    console.error("Error fetching booking status:", error);
    throw error;
  }
  return data;
});
