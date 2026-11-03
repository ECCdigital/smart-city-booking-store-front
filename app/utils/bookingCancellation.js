import { isLiveBooking } from "~/utils/bookingStatus.js";

/**
 * What a signed-in customer may do about cancelling one of their bookings.
 * The booking is cancelled at
 * once, the refund follows the tenant's customer tiers, and the backend
 * mails a confirmation with the cancellation document.
 */

/** The 403 code the cancel route answers with when the tenant's policy forbids it. */
export const USER_CANCELLATION_DISABLED = "booking_user_cancellation_disabled";
/** The 400 code the cancel route answers with when the reason is missing. */
export const REASON_REQUIRED = "reason_required";

export const CANCELLATION_AVAILABILITY = Object.freeze({
  /** Nothing to cancel: the booking is not live, or its end has passed. */
  HIDDEN: "hidden",
  /** The tenant's policy forbids a cancellation through the portal. */
  BLOCKED: "blocked",
  AVAILABLE: "available",
});

/**
 * The failure a refused cancellation names: the missing reason (400), the
 * policy (403 with its code), a booking that is no longer live or no longer
 * there (409, 404), or nothing in particular.
 */
export const CANCELLATION_FAILURE = Object.freeze({
  REASON: "reason",
  POLICY: "policy",
  GONE: "gone",
});

/**
 * The open cancellation request on a booking: a `REJECT` hook as the
 * booking list carries it, read into the fields the storefront shows.
 * `null` when none is open. A hook on a booking that is no longer live is
 * history, not an open request.

 * @param {{ hooks?: Array<{ id?: string, type?: string, timeCreated?: number, payload?: { reason?: string, bankDetails?: object } }> }} booking
 * @returns {{ id: string | undefined, timeCreated: number | undefined, reason: string, bankDetails: object | null } | null}
 */
export function openCancellationRequestOf(booking) {
  if (!isLiveBooking(booking) || !Array.isArray(booking?.hooks)) {
    return null;
  }
  const hook = booking.hooks.find((entry) => entry?.type === "REJECT");
  if (!hook) {
    return null;
  }
  return {
    id: hook.id,
    timeCreated: hook.timeCreated,
    reason: hook.payload?.reason ?? "",
    bankDetails: hook.payload?.bankDetails ?? null,
  };
}

/**
 * When the booking's use ends: the slot end, or for an event booking without
 * slot times the event's end (as `enrichBookingsWithEventDateTimes` attaches
 * it, or as the booking answer names it). `null` when unknown.
 * @returns {number | null}
 */
export function bookingEndOf(booking) {
  const end = booking?.timeEnd ?? booking?.eventEnd ?? booking?.event?.timeEnd;
  return typeof end === "number" && Number.isFinite(end) ? end : null;
}

/**
 * Whether the customer may cancel, and if not, why (one of
 * CANCELLATION_AVAILABILITY). Shown only for a live booking whose end has
 * not passed; blocked where the tenant's `cancellationPolicy` does not say
 * `userCancellable: true`. An open request (`openCancellationRequestOf`)
 * does not change the answer.
 */
export function cancellationAvailabilityOf(booking, now = Date.now()) {
  if (!isLiveBooking(booking)) {
    return CANCELLATION_AVAILABILITY.HIDDEN;
  }
  const end = bookingEndOf(booking);
  if (end !== null && end < now) {
    return CANCELLATION_AVAILABILITY.HIDDEN;
  }
  if (booking?.cancellationPolicy?.userCancellable !== true) {
    return CANCELLATION_AVAILABILITY.BLOCKED;
  }
  return CANCELLATION_AVAILABILITY.AVAILABLE;
}

/** The tenant's own hint for a blocked cancellation, empty when it set none. */
export function cancellationContactHintOf(booking) {
  const hint = booking?.cancellationPolicy?.contactHint;
  return typeof hint === "string" ? hint.trim() : "";
}

/**
 * The backend's error body behind a refused BFF request: the proxy passes
 * it on as `data` of the error `useApiClient` returns.
 */
function backendBodyOf(error) {
  const envelope = error?.data;
  const body = envelope && typeof envelope === "object" ? envelope.data : null;
  return body && typeof body === "object" ? body : null;
}

/**
 * The failure a refused cancellation names (CANCELLATION_FAILURE), `null`
 * for everything else: the dialog then keeps the form and lets the customer
 * try again.
 */
export function resolveCancellationFailure(error) {
  const status = error?.statusCode;
  const code = backendBodyOf(error)?.code;
  if (status === 400 && code === REASON_REQUIRED) {
    return CANCELLATION_FAILURE.REASON;
  }
  if (status === 403 && code === USER_CANCELLATION_DISABLED) {
    return CANCELLATION_FAILURE.POLICY;
  }
  if (status === 409 || status === 404) {
    return CANCELLATION_FAILURE.GONE;
  }
  return null;
}
