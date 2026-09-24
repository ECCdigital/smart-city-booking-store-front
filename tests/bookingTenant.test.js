import { describe, expect, it } from "vitest";

import { bookingTenantOf } from "~/utils/bookingTenant.js";
import { decideEmergencyHelp, supportContactOf } from "~/utils/emergencyHelp.js";

/**
 * The tenant as a booking-bound customer route sends it with every booking
 * (`booking.tenant`, backend ticket 18, `Tenant#exportBookingSnapshot`): the
 * field names of the public projection, whatever the tenant's standing.
 */
const berlinSnapshot = () => ({
  id: "berlin",
  name: "Stadt Berlin",
  contactName: "Bürgerbüro Berlin",
  mail: "buergerbuero@example.org",
  phone: "+49 30 000",
  accessApps: [
    {
      id: "ifbs",
      customerService: {
        name: "Servicestelle Fahrradboxen",
        phone: "+49 30 1234567",
        email: "boxen@example.org",
      },
    },
  ],
});

describe("bookingTenantOf", () => {
  it("names the tenant the booking carries while the public tenant is missing", () => {
    // A tenant pending approval or declined is absent from the public list.
    const booking = { id: "XMSD-SJKM", tenantId: "berlin", tenant: berlinSnapshot() };

    expect(bookingTenantOf(booking, undefined)?.name).toBe("Stadt Berlin");
  });

  it("falls back to the public tenant for an answer without a snapshot", () => {
    // A backend before ticket 18 sends the booking without `tenant`.
    const publicTenant = { id: "berlin", name: "Berlin (öffentlich)" };

    expect(bookingTenantOf({ id: "XMSD-SJKM", tenantId: "berlin" }, publicTenant)).toBe(
      publicTenant,
    );
  });

  it("takes the snapshot over the public tenant where both are there", () => {
    const booking = { id: "XMSD-SJKM", tenantId: "berlin", tenant: berlinSnapshot() };
    const publicTenant = { id: "berlin", name: "Berlin (öffentlich)" };

    expect(bookingTenantOf(booking, publicTenant)?.name).toBe("Stadt Berlin");
  });

  it("knows no tenant for a deleted one the store does not hold either", () => {
    expect(bookingTenantOf({ id: "XMSD-SJKM", tenantId: "gone", tenant: null }, undefined)).toBeNull();
  });

  it("has only the public tenant while there is no booking to read", () => {
    // The scan page's error block, before a booking resolved.
    const publicTenant = { id: "berlin", name: "Berlin (öffentlich)" };

    expect(bookingTenantOf(null, publicTenant)).toBe(publicTenant);
    expect(bookingTenantOf(null, undefined)).toBeNull();
  });
});

describe("the contact at the lock, from the booking's snapshot", () => {
  /** A booking with a granted IFBS compartment, as `/api/access/bookings` sends it. */
  const bookingWithCompartment = (tenant) => ({
    id: "XMSD-SJKM",
    tenantId: "berlin",
    tenant,
    accessInfo: [
      {
        accessPointId: "anlage-1:4711",
        accessPointType: "locker",
        provider: "ifbs",
        grant: { authorizationId: 4711, externalPrincipalId: null, secret: "encrypted-pin" },
        hold: null,
        compartment: "12",
        revokedAt: null,
      },
    ],
  });

  it("hands out the Provider Support Contact while the public tenant is missing", () => {
    const booking = bookingWithCompartment(berlinSnapshot());

    expect(supportContactOf(bookingTenantOf(booking, undefined), "ifbs")).toEqual({
      name: "Servicestelle Fahrradboxen",
      phone: "+49 30 1234567",
      email: "boxen@example.org",
      source: "provider",
    });
  });

  it("falls back to the snapshot's general contact for a provider that names none", () => {
    const booking = bookingWithCompartment(berlinSnapshot());

    expect(supportContactOf(bookingTenantOf(booking, undefined), "nuki")).toEqual({
      name: "Bürgerbüro Berlin",
      phone: "+49 30 000",
      email: "buergerbuero@example.org",
      source: "tenant",
    });
  });

  it("offers the emergency help for a confirmed compartment while the public tenant is missing", () => {
    const booking = bookingWithCompartment(berlinSnapshot());

    expect(decideEmergencyHelp(bookingTenantOf(booking, undefined), booking)).toEqual({
      providerId: "ifbs",
      serviceInfo: {
        name: "Servicestelle Fahrradboxen",
        phone: "+49 30 1234567",
        email: "boxen@example.org",
      },
      processId: "4711",
      compartment: "12",
    });
  });

  it("has nothing to say for a deleted tenant the store does not hold either", () => {
    const booking = bookingWithCompartment(null);

    expect(supportContactOf(bookingTenantOf(booking, undefined), "ifbs")).toBeNull();
    expect(decideEmergencyHelp(bookingTenantOf(booking, undefined), booking)).toBeNull();
  });
});
