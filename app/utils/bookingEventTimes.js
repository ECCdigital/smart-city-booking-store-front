/**
 * Event bookings created without slot times (`timeBegin` / `timeEnd`) carry
 * their schedule on the referenced event instead. This module looks that
 * schedule up so the booking list can show and sort those bookings.
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
        return booking;
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
