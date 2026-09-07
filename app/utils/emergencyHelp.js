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
