import { describe, expect, it } from "vitest";

import { isTenantNotAvailable } from "~/utils/tenantHome.js";

describe("whether a tenant page is not available", () => {
  it("is when the bundle answers 404 for the tenant of the URL", () => {
    // Missing, declined and pending approval are one answer: "Tenant Not Found".
    expect(
      isTenantNotAvailable({
        tenantID: "gone",
        error: { statusCode: 404, statusMessage: "Tenant Not Found" },
      }),
    ).toBe(true);
  });

  it("is not when the backend fails or does not answer", () => {
    expect(
      isTenantNotAvailable({ tenantID: "a", error: { statusCode: 500 } }),
    ).toBe(false);
    expect(
      isTenantNotAvailable({ tenantID: "a", error: { statusCode: 502 } }),
    ).toBe(false);
  });

  it("is not when the load did not fail", () => {
    expect(isTenantNotAvailable({ tenantID: "a", error: null })).toBe(false);
  });

  it("is not on a page outside a tenant", () => {
    expect(
      isTenantNotAvailable({ tenantID: null, error: { statusCode: 404 } }),
    ).toBe(false);
  });
});
