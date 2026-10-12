/**
 * The format of an event (`event.format`) and its participation link
 * (ECCdigital/tickets#456, rules from ECCdigital/tickets#180).
 *
 * Who sees the link: without registration everyone, on the detail page from
 * the public `eventLocation.url`; with registration only the bookers, in
 * their account from `booking.event.participationLink`, which the backend
 * names once the booking is confirmed. The public API hands out an empty
 * `eventLocation.url` for an event with registration.
 */

export const EVENT_FORMAT = Object.freeze({
  PRESENCE: 0,
  HYBRID: 1,
  ONLINE: 2,
});

const FORMAT_KEYS = Object.freeze({
  [EVENT_FORMAT.PRESENCE]: "presence",
  [EVENT_FORMAT.HYBRID]: "hybrid",
  [EVENT_FORMAT.ONLINE]: "online",
});

/**
 * The format of an event; an unknown or missing one counts as presence, the
 * backend's default.
 *
 * @param {Object} event
 * @returns {number} One of `EVENT_FORMAT`
 */
export function eventFormatOf(event) {
  const format = event?.format;
  return typeof format === "number" && Object.hasOwn(FORMAT_KEYS, format)
    ? format
    : EVENT_FORMAT.PRESENCE;
}

/**
 * @param {Object} event
 * @returns {string} The i18n key of the format's label, e.g. `events.format.online`
 */
export function eventFormatLabelKey(event) {
  return `events.format.${FORMAT_KEYS[eventFormatOf(event)]}`;
}

/**
 * An address that may go into an `href`: an http(s) URL, else none.
 *
 * @param {string|null|undefined} url
 * @returns {string|null}
 */
function httpLinkOf(url) {
  const trimmed = typeof url === "string" ? url.trim() : "";
  if (!trimmed) return null;
  try {
    const { protocol } = new URL(trimmed);
    return protocol === "https:" || protocol === "http:" ? trimmed : null;
  } catch {
    return null;
  }
}

/**
 * The participation link the detail page shows to everyone: only for an
 * online or hybrid event without registration.
 *
 * @param {Object} event An event as the public API delivers it
 * @returns {string|null}
 */
export function publicParticipationLinkOf(event) {
  if (event?.attendees?.needsRegistration) return null;
  if (eventFormatOf(event) === EVENT_FORMAT.PRESENCE) return null;
  return httpLinkOf(event?.eventLocation?.url);
}

/**
 * The participation link of a booking as its booker sees it. The backend
 * names it in the booking's event core data once the booking is confirmed
 * and the event is online or hybrid, `null` otherwise.
 *
 * @param {Object} booking A booking as `/api/bookings/assigned` delivers it
 * @returns {string|null}
 */
export function bookingParticipationLinkOf(booking) {
  return httpLinkOf(booking?.event?.participationLink);
}
