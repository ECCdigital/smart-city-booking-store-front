import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

/**
 * The refund the backend would grant if the signed-in owner cancelled now:
 * `originalAmountEur`, `refundAmountEur`, `cancellationFeeEur`,
 * `appliedRefundPercentage`, `daysBeforeStart`, `appliedTierDays`. The
 * backend checks `booking.cancel` with reach `own`, so the cookie token is
 * all it needs. It checks neither the policy nor the status: a refused
 * cancellation still gets a preview.
 */
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");

  const { data, error } = await serverFetch(
    event,
    `/api/${encodeURIComponent(tenantID)}/bookings/${encodeURIComponent(
      bookingId,
    )}/cancellation-refund-preview`,
    { method: "GET" },
  );

  if (error) {
    console.error("Error fetching cancellation refund preview:", error);
    throw createError(
      proxyErrorOf(error, "Failed to fetch cancellation refund preview"),
    );
  }
  return data;
});
