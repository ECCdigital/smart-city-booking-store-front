import { describe, expect, it } from "vitest";

import {
  compartmentsOf,
  customerServiceOf,
  decideEmergencyHelp,
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
