import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

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
    throw createError(proxyErrorOf(error, "Failed to fetch booking status"));
  }
  return data;
});
