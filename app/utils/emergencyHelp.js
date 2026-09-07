/**
 * The emergency help of the access flow: what a tenant tells its customers to
 * do when a compartment or door fails, and for which booking there is
 * something to tell.
 *
 * The contact lives in the public tenant projection (`GET /api/tenants/public`
 * → `accessApps[].customerService`, backend 4.3), one per access provider -
 * never per door or per booking. This module reads that projection and the
 * booking's `accessInfo`; nothing here talks to the network, which is what
 * lets `useEmergencyHelp` stay a thin reader of the tenant store and what
 * lets `tests/emergencyHelp.test.js` pin the decisions.
 */

/**
 * The customer-service contact the tenant names for a provider.
 *
 * @param {Object|undefined} tenant A tenant from the store, or nothing when
 *   the store is empty
 * @param {string} providerId The provider key an access point carries
 *   (`ifbs`, `nuki`, …)
 * @returns {{ name?: string, phone?: string, email?: string }|null}
 */
export function customerServiceOf(tenant, providerId) {
  const app = tenant?.accessApps?.find((entry) => entry.id === providerId);
  return app?.customerService ?? null;
}

/**
 * The compartments a booking holds, read from its `accessInfo` entries of
 * type `locker` (backend 4.3), in the entries' order. A compartment is
 * confirmed once the provider granted it and nobody revoked the grant - the
 * rule `deriveLockerInfo` used for `lockerInfo.isConfirmed`. The grant's
 * `authorizationId` is the "booking id" a person reads to the hotline; the
 * grant's secret is not read and never leaves this function.
 *
 * @param {Object|undefined} booking A booking as `/api/bookings/assigned`
 *   sends it
 * @returns {Array<{ accessPointId: string, provider: string|null,
 *   authorizationId: string|null, compartment: string|null,
 *   isConfirmed: boolean }>}
 */
export function compartmentsOf(booking) {
  return (booking?.accessInfo ?? [])
    .filter((entry) => entry.accessPointType === "locker")
    .map((entry) => {
      const authorizationId = entry.grant?.authorizationId ?? null;
      return {
        accessPointId: entry.accessPointId,
        provider: entry.provider ?? null,
        authorizationId:
          authorizationId === null ? null : String(authorizationId),
        compartment: entry.compartment ?? null,
        isConfirmed: authorizationId !== null && !entry.revokedAt,
      };
    });
}

/**
 * What the emergency help has to show for a booking: the first confirmed
 * compartment whose provider has a contact at the tenant, with the contact
 * and the compartment's booking id (glossary "bestätigtes Fach"). A
 * compartment on hold, a revoked one, or one of a provider the tenant names
 * no contact for (Pareva mails on its own) yields nothing - the accordion
 * then stays away rather than showing a contact with nothing to say.
 *
 * @param {Object|undefined} tenant A tenant from the store
 * @param {Object|undefined} booking A booking as `/api/bookings/assigned`
 *   sends it
 * @returns {{ providerId: string, serviceInfo: Object, processId: string,
 *   compartment: string|null }|null}
 */
export function decideEmergencyHelp(tenant, booking) {
  for (const candidate of compartmentsOf(booking)) {
    if (!candidate.isConfirmed) continue;
    const serviceInfo = customerServiceOf(tenant, candidate.provider);
    if (!serviceInfo) continue;
    return {
      providerId: candidate.provider,
      serviceInfo,
      processId: candidate.authorizationId,
      compartment: candidate.compartment,
    };
  }
  return null;
}
