import { describe, expect, it } from "vitest";

import { isReleaseSensitivePath } from "~~/server/utils/releaseFreshness";

/**
 * Which proxy answers a browser, CDN or reverse proxy must not store, because
 * they carry a tenant or offer release (tenant supervision).
 */
describe("isReleaseSensitivePath", () => {
  it.each([
    "/api/catalog/bundle",
    "/api/catalog/bundle?include=bookables&slug=sport",
    "/api/catalog/tenant-a/bundle?bookableId=b-1",
    "/api/catalog",
    "/api/catalog/sport",
    "/api/tenants",
    "/api/tenants/tenant-a",
    "/api/tenants/tenant-a/payment-providers",
    "/api/bookables/tenant-a",
    "/api/bookables/tenant-a/availability/b-1?startDate=1",
    "/api/bookables/tenant-a/block-periods/b-1",
    "/api/bookables/tenant-a/occupancy/b-1",
    "/api/bookables/tenant-a/price/b-1",
    "/api/events/tenant-a",
    "/api/events/tenant-a/event/e-1",
    "/api/checkout/b-1?tenantId=tenant-a",
    "/api/checkout/b-1/permissions",
    "/api/checkout/b-1/validate",
  ])("marks %s as not storable", (path) => {
    expect(isReleaseSensitivePath(path)).toBe(true);
  });

  it.each([
    // Versioned theme assets and the image proxy own their cache headers.
    "/api/theme/bundle",
    "/api/theme/css?v=abc",
    "/api/theme/favicon?v=abc",
    "/api/img?url=%2Fapi%2Fv2%2Fmedia%2Ffile%2F1",
    // The portal mode carries no release and stays in the server-side cache,
    // which writes its own Cache-Control.
    "/api/catalog/mode",
    // Pages and build assets are not proxy answers.
    "/",
    "/t/tenant-a/bookables/b-1",
    "/_nuxt/entry.js",
  ])("leaves %s alone", (path) => {
    expect(isReleaseSensitivePath(path)).toBe(false);
  });

  it("matches whole path segments only", () => {
    expect(isReleaseSensitivePath("/api/tenantsfoo")).toBe(false);
    expect(isReleaseSensitivePath("/api/catalog/modes")).toBe(true);
  });
});
