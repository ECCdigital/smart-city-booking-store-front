/**
 * The framework-free part of the key list on the mobile key page: how a
 * booking with access points is searched and narrowed to providers. A
 * booking carries its lead bookable (title, location) and its id.
 */

import { includesText } from "./textSearch.js";

/**
 * The bookings whose lead bookable's title, booking id or address holds the
 * searched text, case and accents aside. An empty query keeps everything.
 */
export function searchAccessBookings(bookings, query) {
  return (bookings ?? []).filter((booking) =>
    [
      booking?.leadBookable?.title,
      booking?.id,
      booking?.leadBookable?.location?.display_address,
    ].some((field) => field && includesText(field, query)),
  );
}

/** The bookings of the chosen providers; no choice narrows nothing. */
export function filterAccessBookingsByTenant(bookings, tenantIds = []) {
  if (!tenantIds.length) return bookings ?? [];
  return (bookings ?? []).filter((booking) =>
    tenantIds.includes(booking.tenantId),
  );
}

/**
 * The providers the bookings belong to, each once, in the order they first
 * appear, named by the caller (the tenant store knows the names).
 */
export function tenantsOfAccessBookings(bookings, nameOf = (id) => id) {
  const seen = new Map();
  for (const booking of bookings ?? []) {
    const id = booking?.tenantId;
    if (!id || seen.has(id)) continue;
    seen.set(id, { id, name: nameOf(id) || id });
  }
  return [...seen.values()];
}
