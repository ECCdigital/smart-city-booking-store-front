/**
 * The tenant a booking page speaks for: whose name it shows and whose
 * contact it hands out at the lock.
 *
 * Every booking-bound customer route (`/api/bookings/assigned`, the booking
 * status, both access booking routes) sends each booking with `tenant`, the
 * tenant as it stands for its customers (backend ticket 18,
 * `Tenant#exportBookingSnapshot`) - with the field names of the public
 * projection and whatever the tenant's standing. The public projection is not
 * the source for a booking: a tenant pending approval or declined is absent
 * from it, and its customers still hold their bookings.
 */

/**
 * @typedef {Object} BookingTenant
 * @property {string} id
 * @property {string} name
 * @property {string} [contactName]
 * @property {string} [mail]
 * @property {string} [phone]
 * @property {Array<{ id: string, customerService: { name?: string,
 *   phone?: string, email?: string }|null }>} [accessApps]
 */

/**
 * The tenant of a booking: the booking's own snapshot first; the public
 * tenant only where the answer carries none - a backend before the snapshot,
 * or a page that has no booking to read yet (the scan page before its
 * booking resolved). So the public tenant is a fallback to render from, never
 * a prerequisite.
 *
 * @param {Object|null|undefined} booking A booking as a booking-bound
 *   customer route sends it
 * @param {BookingTenant|null|undefined} [publicTenant] The tenant as the
 *   tenant store holds it, or nothing when the store does not know it
 * @returns {BookingTenant|null}
 */
export function bookingTenantOf(booking, publicTenant = null) {
  return booking?.tenant ?? publicTenant ?? null;
}
