import { describe, expect, it } from "vitest";

import { customerServiceOf } from "~/utils/emergencyHelp.js";

const IFBS_CONTACT = Object.freeze({
  name: "Servicestelle Fahrradboxen",
  phone: "+49 30 1234567",
  email: "boxen@example.org",
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
