/**
 * Event bookings created without slot times (`timeBegin` / `timeEnd`) carry
 * their schedule on the referenced event instead. This module looks that
 * schedule up so the booking list can show and sort those bookings.
 *
 * The catalog answers first. Where it does not - the tenant is pending
 * approval or declined and so publicly absent, or the event left the
 * catalog - the booking answer's own `event` (title and times) stands in:
 * a customer's booking pages never fail on catalog data.
 */

export function buildEventDateTime(date, time) {
  if (!date) {
    return null;
  }

  const dateTime = time ? `${date}T${time}` : `${date}T00:00:00`;
  const timestamp = new Date(dateTime).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== "";
}

/**
 * The fallback where the catalog does not answer for the event (the tenant
 * is not public, the event left the catalog): the booking answer carries the
 * event's core data in `booking.event`, with `timeBegin` / `timeEnd` already
 * in epoch milliseconds. A booking without it (the event is gone, or an
 * older backend) stays as it is.
 */
function withBookingEventTimes(booking) {
  if (!booking.event) {
    return booking;
  }

  return {
    ...booking,
    eventBegin: booking.event.timeBegin,
    eventEnd: booking.event.timeEnd,
  };
}

/**
 * Adds `eventBegin` / `eventEnd` to bookings that have no slot times but
 * reference an event. `fetchEventById(tenantId, eventId)` is injected so the
 * lookup can run outside Nuxt.
 */
export async function enrichBookingsWithEventDateTimes(
  bookings,
  fetchEventById,
) {
  if (!Array.isArray(bookings) || bookings.length === 0) {
    return bookings;
  }

  // Caches the pending lookup, not its result, so bookings that share an
  // event and resolve concurrently trigger a single request.
  const eventCache = new Map();
  const lookupEvent = (tenantId, eventId) => {
    if (!eventCache.has(eventId)) {
      eventCache.set(
        eventId,
        // A missing event (deleted, or absent from this backend) must not
        // take the whole list down: the booking just shows without times.
        Promise.resolve(fetchEventById(tenantId, eventId)).catch(() => null),
      );
    }
    return eventCache.get(eventId);
  };

  return Promise.all(
    bookings.map(async (booking) => {
      if (hasValue(booking.timeBegin) && hasValue(booking.timeEnd)) {
        return booking;
      }

      const eventId = booking?.bookableItems?.[0]?._bookableUsed?.eventId;

      if (!eventId) {
        return booking;
      }

      const event = await lookupEvent(booking.tenantId, eventId);
      const eventInformation = event?.information;

      if (!eventInformation) {
        return withBookingEventTimes(booking);
      }

      return {
        ...booking,
        eventBegin: buildEventDateTime(
          eventInformation.startDate,
          eventInformation.startTime,
        ),
        eventEnd: buildEventDateTime(
          eventInformation.endDate,
          eventInformation.endTime,
        ),
      };
    }),
  );
}

/**
 * The event the booking detail page shows from the booking answer
 * (`booking.event`: id, title, `timeBegin` / `timeEnd` in epoch
 * milliseconds) where the catalog holds none of the booking's events: the
 * tenant is not public, or the event left the catalog. `null` while the
 * catalog answers (its events stay preferred) and when the booking answer
 * carries no event (not a ticket booking, an older backend, or the event is
 * gone).
 *
 * @param {Object} booking
 * @param {Object[]} catalogEvents The booking's events as the event store holds them
 * @returns {{ id: string, title: string, timeBegin: number|null, timeEnd: number|null } | null}
 */
export function bookingEventFallback(booking, catalogEvents) {
  if (catalogEvents.length > 0) {
    return null;
  }

  return booking.event ?? null;
}

function isTicketBooking(booking) {
  return (booking?.bookableItems ?? []).some(
    (item) => item?._bookableUsed?.type === "ticket",
  );
}

/**
 * Loads the catalog's events for the booking list, and only when a ticket
 * booking is among `bookings`. Resolves `true` once the bundle answered and
 * `false` otherwise: the bundle is an extra, so no failed load rejects - the
 * 404 of a tenant that is no longer public (also the bundle proxy under
 * `/t/:tenantID/...`) no more than a failing backend. The list renders
 * without catalog extras.
 * `loadBundle` is injected so the decision can run outside Nuxt.
 */
export async function loadCatalogEventsForBookings(bookings, loadBundle) {
  if (!Array.isArray(bookings) || !bookings.some(isTicketBooking)) {
    return false;
  }

  try {
    await loadBundle({ include: ["events"] });
    return true;
  } catch {
    return false;
  }
}
