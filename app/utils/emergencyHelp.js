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

const CONTACT_FIELDS = Object.freeze(["name", "phone", "email"]);

const isFilled = (value) => typeof value === "string" && value.trim() !== "";

/**
 * The Provider Support Contact shown at the Control Button (glossary), with
 * the whole-or-fallback rule: the provider's `customerService` counts as
 * entered once any of its three fields is filled and is then handed out as
 * a whole - even with an empty field in it. Only a provider that names none
 * of the three (the admin saves `{ name: "", email: "", phone: "" }` for
 * IFBS) falls back to the tenant's general contact. The two are never mixed.
 *
 * @param {Object|undefined} tenant A tenant from the store
 * @param {string} providerId The provider key an access point carries
 * @returns {{ name: string, phone: string, email: string,
 *   source: "provider"|"tenant" }|null} `null` when nobody names anything
 */
export function supportContactOf(tenant, providerId) {
  const providerContact = customerServiceOf(tenant, providerId);
  if (providerContact && CONTACT_FIELDS.some((f) => isFilled(providerContact[f]))) {
    return {
      name: providerContact.name ?? "",
      phone: providerContact.phone ?? "",
      email: providerContact.email ?? "",
      source: "provider",
    };
  }

  const tenantContact = {
    name: tenant?.contactName ?? "",
    phone: tenant?.phone ?? "",
    email: tenant?.mail ?? "",
  };
  if (!CONTACT_FIELDS.some((f) => isFilled(tenantContact[f]))) {
    return null;
  }
  return { ...tenantContact, source: "tenant" };
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

/**
 * Whether a tenant list carries the access apps at all. The catalog bundle
 * fills the tenant store with the catalog's own projection (id, name and the
 * general contact) and none of the access apps; the public tenant route is
 * the only source of `accessApps`. A list without them cannot answer for a
 * Provider Support Contact, however many tenants it holds.
 *
 * @param {Object[]|undefined} tenants Tenants as the store holds them
 * @returns {boolean}
 */
export function hasAccessApps(tenants) {
  return (
    Array.isArray(tenants) &&
    tenants.length > 0 &&
    tenants.every((tenant) => Array.isArray(tenant?.accessApps))
  );
}

/**
 * Hands every tenant of the store its `accessApps` from the public tenant
 * list, by id, and changes nothing else: the list keeps its members and their
 * order, so what the catalog decided is visible stays decided. A tenant the
 * public list does not name gets an empty list, which is a fact ("no access
 * apps"), not a missing one. Nothing loaded before means the public list is
 * the store's list.
 *
 * @param {Object[]} tenants Tenants as the store holds them
 * @param {Object[]} publicTenants Tenants as `GET /api/tenants` sends them
 * @returns {Object[]}
 */
export function withAccessApps(tenants, publicTenants) {
  if (!tenants?.length) {
    return publicTenants;
  }
  const appsById = new Map(
    (publicTenants ?? []).map((tenant) => [tenant.id, tenant.accessApps ?? []]),
  );
  return tenants.map((tenant) => ({
    ...tenant,
    accessApps: appsById.get(tenant.id) ?? [],
  }));
}
