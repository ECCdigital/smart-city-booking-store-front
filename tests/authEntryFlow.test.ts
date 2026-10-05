import { describe, expect, it } from "vitest";

import {
  adminEntry,
  offerSpacesEntryUrl,
  signupOutcome,
  verifiedReturnTarget,
} from "~/utils/authEntryFlow";

const NOW = Date.parse("2026-09-21T10:00:00Z");

describe("signupOutcome", () => {
  it("confirms neutrally when the signup went through", () => {
    expect(signupOutcome(null, NOW)).toEqual({ kind: "confirmation" });
  });

  it("confirms just the same when a backend still answers 409", () => {
    // Telling "already registered" apart would disclose the account.
    expect(signupOutcome({ statusCode: 409 }, NOW)).toEqual({
      kind: "confirmation",
    });
    expect(signupOutcome({ status: 409 }, NOW)).toEqual({
      kind: "confirmation",
    });
  });

  it("reports a rate limit with its wait", () => {
    expect(
      signupOutcome(
        {
          statusCode: 429,
          response: { headers: new Headers({ "Retry-After": "600" }) },
        },
        NOW,
      ),
    ).toEqual({ kind: "rateLimited", seconds: 600 });
    expect(signupOutcome({ statusCode: 429 }, NOW)).toEqual({
      kind: "rateLimited",
      seconds: null,
    });
  });

  it("reports every other error as a plain failure", () => {
    expect(signupOutcome({ statusCode: 400 }, NOW)).toEqual({ kind: "failed" });
    expect(signupOutcome({ statusCode: 500 }, NOW)).toEqual({ kind: "failed" });
    expect(signupOutcome(new Error("network"), NOW)).toEqual({
      kind: "failed",
    });
  });
});

describe("verifiedReturnTarget", () => {
  const admin = { adminOrigin: "https://admin.example.com" };

  it("prefers the target the backend answers over the mail link's", () => {
    expect(
      verifiedReturnTarget(
        { answered: "/checkout/7", linked: "/account" },
        admin,
      ),
    ).toBe("/checkout/7");
  });

  it("falls back to the mail link's target", () => {
    expect(
      verifiedReturnTarget(
        { answered: null, linked: "https://admin.example.com/onboarding" },
        admin,
      ),
    ).toBe("https://admin.example.com/onboarding");
  });

  it("skips an unsafe answer instead of following it", () => {
    expect(
      verifiedReturnTarget(
        { answered: "https://evil.example", linked: "/account" },
        admin,
      ),
    ).toBe("/account");
    expect(
      verifiedReturnTarget(
        { answered: undefined, linked: "//evil.example" },
        admin,
      ),
    ).toBeNull();
  });
});

describe("offerSpacesEntryUrl", () => {
  const open = { allowAllUsersToCreateTenant: true };

  it("links the admin UI's onboarding when self-creation is open", () => {
    expect(offerSpacesEntryUrl("https://admin.example.com", open)).toBe(
      "https://admin.example.com/onboarding",
    );
    expect(offerSpacesEntryUrl("https://admin.example.com/", open)).toBe(
      "https://admin.example.com/onboarding",
    );
    expect(offerSpacesEntryUrl("https://example.com/admin/", open)).toBe(
      "https://example.com/admin/onboarding",
    );
  });

  it("has no entry without a configured admin UI", () => {
    expect(offerSpacesEntryUrl("", open)).toBeNull();
    expect(offerSpacesEntryUrl(undefined, open)).toBeNull();
    expect(offerSpacesEntryUrl("javascript:alert(1)", open)).toBeNull();
  });

  it("has no entry unless the public instance opens self-creation", () => {
    const base = "https://admin.example.com";
    expect(offerSpacesEntryUrl(base, null)).toBeNull();
    expect(offerSpacesEntryUrl(base, {})).toBeNull();
    expect(
      offerSpacesEntryUrl(base, { allowAllUsersToCreateTenant: false }),
    ).toBeNull();
    expect(
      offerSpacesEntryUrl(base, { allowAllUsersToCreateTenant: "true" }),
    ).toBeNull();
  });
});

describe("adminEntry", () => {
  const admin = "https://admin.example.com";
  const membership = {
    tenantId: "t1",
    isOwner: false,
    adminInterfaces: ["bookings"],
    freeBookings: false,
    manageUsers: {},
    manageRoles: {},
    manageBookables: {},
    manageBookings: {},
    manageCoupons: {},
    manageMedia: {},
  };

  it("offers the Admin Entry to a member of a tenant, in a new tab", () => {
    expect(
      adminEntry(
        { tenants: [membership], allowCreateTenant: false, instanceOwner: false },
        admin,
      ),
    ).toEqual({ kind: "admin", url: admin, target: "_blank" });
  });

  it("offers the Offer Spaces Entry to a user who may create a tenant, same tab", () => {
    expect(
      adminEntry(
        { tenants: [], allowCreateTenant: true, instanceOwner: false },
        admin,
      ),
    ).toEqual({
      kind: "offerSpaces",
      url: "https://admin.example.com/onboarding",
      target: "_self",
    });
    expect(
      adminEntry(
        { tenants: [], allowCreateTenant: true, instanceOwner: false },
        "https://example.com/admin/",
      ),
    ).toEqual({
      kind: "offerSpaces",
      url: "https://example.com/admin/onboarding",
      target: "_self",
    });
  });

  it("offers the Admin Entry to an instance owner without a membership", () => {
    expect(
      adminEntry(
        { tenants: [], allowCreateTenant: true, instanceOwner: true },
        admin,
      ),
    ).toEqual({ kind: "admin", url: admin, target: "_blank" });
  });

  it("never shows both: a member who may create a tenant gets the Admin Entry", () => {
    expect(
      adminEntry(
        { tenants: [membership], allowCreateTenant: true, instanceOwner: false },
        admin,
      ),
    ).toEqual({ kind: "admin", url: admin, target: "_blank" });
  });

  it("has no entry for a booker who neither administers nor may create", () => {
    expect(
      adminEntry(
        { tenants: [], allowCreateTenant: false, instanceOwner: false },
        admin,
      ),
    ).toBeNull();
  });

  it("has no entry without a configured admin UI, whatever the rights", () => {
    const owner = { tenants: [membership], allowCreateTenant: true, instanceOwner: true };
    expect(adminEntry(owner, "")).toBeNull();
    expect(adminEntry(owner, undefined)).toBeNull();
    expect(adminEntry(owner, "javascript:alert(1)")).toBeNull();
  });

  it("has no entry with empty or missing permissions", () => {
    expect(adminEntry(null, admin)).toBeNull();
    expect(adminEntry(undefined, admin)).toBeNull();
    expect(adminEntry({}, admin)).toBeNull();
    expect(adminEntry({ tenants: [] }, admin)).toBeNull();
  });
});
