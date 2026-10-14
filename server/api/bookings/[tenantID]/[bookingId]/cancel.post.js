import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { proxyErrorOf } from "~~/server/utils/proxyError";

const BANK_DETAIL_FIELDS = ["accountHolder", "iban", "bic", "bankName"];

function trimmedString(value) {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * PROTOTYPE (ECCdigital/tickets#69): the signed-in owner cancels a booking
 * directly, through the backend route decided in ECCdigital/tickets#222:
 * `POST /api/:tenant/bookings/:id/cancel`, permission `booking.cancel`,
 * own bookings only. The backend cancels at once, computes the refund by
 * the tenant's customer tiers, issues the cancellation document for a
 * priced booking and mails the customer a confirmation with it.
 *
 * Answers, in the order the backend checks them: 400 `reason_required`
 * without a reason, 404 `booking_not_found` for a booking that is not the
 * user's, 403 `booking_user_cancellation_disabled` when the tenant's policy
 * forbids it, 409 `invalid_transition` when the booking is no longer live,
 * 200 without a body on success. The error body is `{ code, message }`.
 *
 * Only the fields the backend reads go through: `reason` (trimmed; the
 * backend refuses an empty one) and the four bank fields, all optional,
 * empty ones left out. The backend drops bank details of an unpaid booking.
 */
export default defineEventHandler(async (event) => {
  const tenantID = getRouterParam(event, "tenantID");
  const bookingId = getRouterParam(event, "bookingId");
  const body = (await readBody(event)) ?? {};

  const payload = { reason: trimmedString(body.reason) };

  const bankDetails = {};
  for (const field of BANK_DETAIL_FIELDS) {
    const value = trimmedString(body.bankDetails?.[field]);
    if (value) {
      bankDetails[field] = value;
    }
  }
  if (Object.keys(bankDetails).length > 0) {
    payload.bankDetails = bankDetails;
  }

  const { data, error } = await serverFetch(
    event,
    `/api/${encodeURIComponent(tenantID)}/bookings/${encodeURIComponent(
      bookingId,
    )}/cancel`,
    { method: "POST", body: payload },
  );

  if (error) {
    console.error("Error cancelling booking:", error);
    throw createError(proxyErrorOf(error, "Failed to cancel booking"));
  }
  return data ?? { success: true };
});
