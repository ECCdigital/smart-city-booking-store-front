import { isLiveBooking } from "~/utils/bookingStatus.js";

/**
 * The withdrawal of a private customer: a mail to the tenant, which the
 * tenant's staff checks. The backend decides who is offered it - a booking
 * without a company, within 14 days of the booking - and answers the mail
 * as `withdrawalUrl` with each of the customer's bookings, `null` otherwise.
 * A withdrawal changes nothing on the booking by itself.
 */

/**
 * The mail of the withdrawal to open, for a live booking the backend offers
 * it for; `null` otherwise.
 *
 * @param {{ withdrawalUrl?: string | null }} booking
 * @returns {string | null}
 */
export function withdrawalUrlOf(booking) {
  const url = booking?.withdrawalUrl;
  if (!isLiveBooking(booking) || typeof url !== "string") {
    return null;
  }
  return url.startsWith("mailto:") ? url : null;
}
