import { isLiveBooking } from "~/utils/bookingStatus.js";
import {
  ACCESS_WINDOW_STATES,
  bookingWindow,
  bookingWindowState,
  compareByAccessWindow,
} from "~/utils/accessWindow.js";

/**
 * The greeting block on the start page for a signed-in person: their next
 * booking, their next key and their favorites. Pure, so what the block picks
 * can be tested without a browser; `now` is always a parameter.
 */

/**
 * A booking's span as epoch ms: its own times, an event booking's event
 * times where it has none, or `null`.
 *
 * @param {{ timeBegin?: number, timeEnd?: number, eventBegin?: number, eventEnd?: number }|null|undefined} booking
 * @returns {{ begin: number, end: number }|null}
 */
export function bookingSpan(booking) {
  if (booking?.timeBegin && booking?.timeEnd) {
    return { begin: booking.timeBegin, end: booking.timeEnd };
  }
  if (booking?.eventBegin && booking?.eventEnd) {
    return { begin: booking.eventBegin, end: booking.eventEnd };
  }
  return null;
}

/**
 * The live booking that has not ended yet and starts first: one that is
 * running now comes before one that is still ahead. Bookings without a span
 * are left out.
 *
 * @param {Array<Object>|null|undefined} bookings
 * @param {number} now
 * @returns {Object|null}
 */
export function nextBooking(bookings, now) {
  return (
    (bookings ?? [])
      .filter((booking) => isLiveBooking(booking))
      .map((booking) => ({ booking, span: bookingSpan(booking) }))
      .filter(({ span }) => span && span.end > now)
      .sort((a, b) => a.span.begin - b.span.begin)[0]?.booking ?? null
  );
}

/**
 * The key to point to: the booking whose Access Window is open now, else the
 * one that opens next. A window that has closed, or a booking without one,
 * is not a key to point to.
 *
 * @param {Array<Object>|null|undefined} accessBookings
 * @param {number} now
 * @returns {{ booking: Object, window: { from: number, to: number }, state: "before"|"during" }|null}
 */
export function nextKey(accessBookings, now) {
  const booking = [...(accessBookings ?? [])]
    .sort(compareByAccessWindow(now))
    .find((entry) => {
      const state = bookingWindowState(entry, now);
      return (
        state === ACCESS_WINDOW_STATES.DURING ||
        state === ACCESS_WINDOW_STATES.BEFORE
      );
    });

  if (!booking) return null;

  return {
    booking,
    window: bookingWindow(booking),
    state: bookingWindowState(booking, now),
  };
}
