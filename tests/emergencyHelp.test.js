import { describe, expect, it } from "vitest";

import {
  compartmentsOf,
  customerServiceOf,
  decideEmergencyHelp,
  supportContactOf,
  withAccessApps,
  hasAccessApps,
} from "~/utils/emergencyHelp.js";

const IFBS_CONTACT = Object.freeze({
  name: "Servicestelle Fahrradboxen",
  phone: "+49 30 1234567",
  email: "boxen@example.org",
});

/**
 * An `accessInfo` entry as backend 4.3 stores a compartment: the grant with
 * its encrypted secret, the box number the provider named, and no `revokedAt`.
 */
const grantedIfbsCompartment = (overrides = {}) => ({
  accessPointId: "anlage-1:4711",
  accessPointType: "locker",
  provider: "ifbs",
  externalId: "anlage-1",
  mode: "remote",
  bookableId: "bike-box",
  grant: {
    authorizationId: 4711,
    externalPrincipalId: null,
    secret: "encrypted-pin",
  },
  hold: null,
  compartment: "12",
  externalBookingId: 4711,
  revokedAt: null,
  ...overrides,
});

/** A tenant as `GET /api/tenants/public` projects it (backend 4.3, B1). */
const tenantWithIfbs = () => ({
  id: "berlin",
  name: "Berlin",
  accessApps: [{ id: "ifbs", customerService: { ...IFBS_CONTACT } }],
});

describe("customerServiceOf", () => {
  it("hands out the contact the tenant names for the provider", () => {
    expect(customerServiceOf(tenantWithIfbs(), "ifbs")).toEqual(IFBS_CONTACT);
  });

  it("knows no contact for a provider the tenant has no app for", () => {
    expect(customerServiceOf(tenantWithIfbs(), "nuki")).toBeNull();
  });

  it("answers null rather than throwing while the store is still empty", () => {
    expect(customerServiceOf(undefined, "ifbs")).toBeNull();
    expect(customerServiceOf({}, "ifbs")).toBeNull();
  });

  it("answers null for a tenant projection without accessApps", () => {
    // A backend before B1 does not project the field at all.
    expect(customerServiceOf({ id: "berlin", name: "Berlin" }, "ifbs")).toBeNull();
  });

  it("answers null for an app that names no contact", () => {
    const tenant = { accessApps: [{ id: "ifbs", customerService: null }] };
    expect(customerServiceOf(tenant, "ifbs")).toBeNull();
  });
});

describe("supportContactOf", () => {
  /** A tenant with a general contact and an IFBS app, as the public projection sends it. */
  const tenantWithGeneralContact = (accessApps) => ({
    id: "berlin",
    name: "Berlin",
    contactName: "Bürgerbüro Berlin",
    phone: "+49 30 000",
    mail: "buergerbuero@example.org",
    accessApps,
  });

  it("hands out the provider's contact as a whole, marked as the provider's", () => {
    expect(
      supportContactOf(
        tenantWithGeneralContact([{ id: "ifbs", customerService: { ...IFBS_CONTACT } }]),
        "ifbs",
      ),
    ).toEqual({ ...IFBS_CONTACT, source: "provider" });
  });

  it("keeps the provider's contact whole when one of its fields is empty - no mixing with the tenant", () => {
    expect(
      supportContactOf(
        tenantWithGeneralContact([
          { id: "ifbs", customerService: { name: "", phone: "+49 30 1234567", email: "" } },
        ]),
        "ifbs",
      ),
    ).toEqual({ name: "", phone: "+49 30 1234567", email: "", source: "provider" });
  });

  it("falls back to the tenant's general contact when the provider names none of the three fields", () => {
    // The admin always saves `{ name: "", email: "", phone: "" }` for IFBS.
    expect(
      supportContactOf(
        tenantWithGeneralContact([
          { id: "ifbs", customerService: { name: "", email: "", phone: "" } },
        ]),
        "ifbs",
      ),
    ).toEqual({
      name: "Bürgerbüro Berlin",
      phone: "+49 30 000",
      email: "buergerbuero@example.org",
      source: "tenant",
    });
  });

  it("falls back to the tenant's general contact for a provider without an app or contact", () => {
    expect(supportContactOf(tenantWithGeneralContact([]), "nuki")).toMatchObject({
      source: "tenant",
    });
    expect(
      supportContactOf(
        tenantWithGeneralContact([{ id: "nuki", customerService: null }]),
        "nuki",
      ),
    ).toMatchObject({ source: "tenant" });
  });

  it("answers null when neither the provider nor the tenant names anything", () => {
    expect(supportContactOf({ id: "berlin", accessApps: [] }, "nuki")).toBeNull();
    expect(
      supportContactOf({ id: "berlin", contactName: "", phone: "", mail: "" }, "nuki"),
    ).toBeNull();
    expect(supportContactOf(undefined, "nuki")).toBeNull();
  });

  it("leaves customerServiceOf's answer untouched by the fallback", () => {
    const tenant = tenantWithGeneralContact([{ id: "nuki", customerService: null }]);
    expect(customerServiceOf(tenant, "nuki")).toBeNull();
  });
});

describe("compartmentsOf", () => {
  it("reads a granted compartment with its booking id as a string, and never the secret", () => {
    const [compartment] = compartmentsOf({
      accessInfo: [grantedIfbsCompartment()],
    });

    expect(compartment).toEqual({
      accessPointId: "anlage-1:4711",
      provider: "ifbs",
      authorizationId: "4711",
      compartment: "12",
      isConfirmed: true,
    });
    expect(JSON.stringify(compartment)).not.toContain("encrypted-pin");
  });

  it("reads a compartment on hold as unconfirmed and without a booking id", () => {
    // Before the grant - an unpaid booking - there is only the claim.
    const [compartment] = compartmentsOf({
      accessInfo: [
        grantedIfbsCompartment({
          grant: null,
          hold: { holdId: "h-1", expiresAt: 1, compartment: "12" },
          externalBookingId: null,
        }),
      ],
    });

    expect(compartment).toMatchObject({
      authorizationId: null,
      isConfirmed: false,
    });
  });

  it("reads a revoked grant as unconfirmed", () => {
    const [compartment] = compartmentsOf({
      accessInfo: [grantedIfbsCompartment({ revokedAt: 1725000000000 })],
    });

    expect(compartment.isConfirmed).toBe(false);
  });

  it("leaves doors out", () => {
    expect(
      compartmentsOf({
        accessInfo: [
          grantedIfbsCompartment({
            accessPointId: "door-1",
            accessPointType: "door",
            provider: "nuki",
          }),
        ],
      }),
    ).toEqual([]);
  });

  it("answers an empty list for a booking without accessInfo", () => {
    expect(compartmentsOf({})).toEqual([]);
    expect(compartmentsOf(undefined)).toEqual([]);
  });
});

describe("decideEmergencyHelp", () => {
  it("offers the provider's contact and the compartment's booking id for a confirmed compartment", () => {
    const decision = decideEmergencyHelp(tenantWithIfbs(), {
      accessInfo: [grantedIfbsCompartment()],
    });

    expect(decision).toEqual({
      providerId: "ifbs",
      serviceInfo: IFBS_CONTACT,
      processId: "4711",
      compartment: "12",
    });
    expect(JSON.stringify(decision)).not.toContain("encrypted-pin");
  });

  it("has nothing to say for a compartment that is only on hold", () => {
    expect(
      decideEmergencyHelp(tenantWithIfbs(), {
        accessInfo: [
          grantedIfbsCompartment({
            grant: null,
            hold: { holdId: "h-1", expiresAt: 1, compartment: "12" },
          }),
        ],
      }),
    ).toBeNull();
  });

  it("has nothing to say once the grant is revoked", () => {
    expect(
      decideEmergencyHelp(tenantWithIfbs(), {
        accessInfo: [grantedIfbsCompartment({ revokedAt: 1725000000000 })],
      }),
    ).toBeNull();
  });

  it("has nothing to say for a provider the tenant names no contact for", () => {
    // Pareva mails its customers itself; the tenant projects no app for it.
    expect(
      decideEmergencyHelp(tenantWithIfbs(), {
        accessInfo: [grantedIfbsCompartment({ provider: "pareva" })],
      }),
    ).toBeNull();
  });

  it("passes over a compartment without help to the one that has it", () => {
    const decision = decideEmergencyHelp(tenantWithIfbs(), {
      accessInfo: [
        grantedIfbsCompartment({
          accessPointId: "pareva-1:9",
          provider: "pareva",
          grant: { authorizationId: 9, externalPrincipalId: null, secret: "x" },
          compartment: "A",
        }),
        grantedIfbsCompartment(),
      ],
    });

    expect(decision).toMatchObject({ providerId: "ifbs", processId: "4711" });
  });

  it("has nothing to say while the tenant store is empty", () => {
    expect(
      decideEmergencyHelp(undefined, { accessInfo: [grantedIfbsCompartment()] }),
    ).toBeNull();
  });
});

describe("withAccessApps", () => {
  const catalogTenants = [
    { id: "t1", name: "Eins", contactName: "A", mail: "a@x.de", phone: "" },
    { id: "t2", name: "Zwei", contactName: "B", mail: "b@x.de", phone: "" },
  ];
  const publicTenants = [
    { id: "t1", name: "Eins", accessApps: [{ id: "nuki", customerService: { name: "Nuki Support", phone: "1", email: "" } }] },
    { id: "t3", name: "Drei", accessApps: [] },
  ];

  it("hands every catalog tenant the access apps of its public counterpart, keeping the list as it is", () => {
    const merged = withAccessApps(catalogTenants, publicTenants);
    expect(merged.map((t) => t.id)).toEqual(["t1", "t2"]);
    expect(merged[0]).toEqual({ ...catalogTenants[0], accessApps: publicTenants[0].accessApps });
    expect(merged[1]).toEqual({ ...catalogTenants[1], accessApps: [] });
  });

  it("is the public list itself when nothing was loaded before", () => {
    expect(withAccessApps([], publicTenants)).toBe(publicTenants);
  });

  it("tells whether the access apps are still missing", () => {
    expect(hasAccessApps(catalogTenants)).toBe(false);
    expect(hasAccessApps(withAccessApps(catalogTenants, publicTenants))).toBe(true);
    expect(hasAccessApps([])).toBe(false);
  });
});
