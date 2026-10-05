import { describe, expect, it } from "vitest";

import {
  appendReturnTarget,
  isExternalReturnTarget,
  parseReturnTarget,
  resolveReturnTarget,
} from "~~/shared/utils/returnTarget";

const admin = { adminOrigin: "https://admin.example.com" };

describe("parseReturnTarget", () => {
  it("keeps a relative in-app path with its query and hash", () => {
    expect(parseReturnTarget("/account/bookings")).toBe("/account/bookings");
    expect(parseReturnTarget("  /t/guben/bookables/1?from=a&to=b#top ")).toBe(
      "/t/guben/bookables/1?from=a&to=b#top",
    );
  });

  it("takes the first value of a repeated query parameter", () => {
    expect(parseReturnTarget(["/account", "https://evil.example"])).toBe(
      "/account",
    );
  });

  it("answers null when there is no target", () => {
    expect(parseReturnTarget(undefined)).toBeNull();
    expect(parseReturnTarget(null)).toBeNull();
    expect(parseReturnTarget("")).toBeNull();
    expect(parseReturnTarget("   ")).toBeNull();
    expect(parseReturnTarget(42)).toBeNull();
  });

  it("refuses absolute addresses on a foreign host", () => {
    expect(parseReturnTarget("https://evil.example/tenants/new")).toBeNull();
    expect(parseReturnTarget("https://evil.example", admin)).toBeNull();
    expect(parseReturnTarget("javascript:alert(1)", admin)).toBeNull();
    expect(parseReturnTarget("data:text/html,x", admin)).toBeNull();
    expect(parseReturnTarget("account", admin)).toBeNull();
  });

  it("refuses protocol-relative targets and their backslash variants", () => {
    expect(parseReturnTarget("//evil.example")).toBeNull();
    expect(parseReturnTarget("/\\evil.example")).toBeNull();
    expect(parseReturnTarget("\\\\evil.example")).toBeNull();
    expect(parseReturnTarget("/\\@evil.example")).toBeNull();
    expect(parseReturnTarget("///evil.example")).toBeNull();
  });

  it("refuses control characters a browser would strip into '//'", () => {
    expect(parseReturnTarget("/\t/evil.example")).toBeNull();
    expect(parseReturnTarget("/\n/evil.example")).toBeNull();
    expect(parseReturnTarget("/\r/evil.example")).toBeNull();
  });

  it("does not decode the target, so encoded slashes stay a path", () => {
    expect(parseReturnTarget("/%2F%2Fevil.example")).toBe(
      "/%2F%2Fevil.example",
    );
    // A still-encoded absolute address is not a path and not an URL.
    expect(parseReturnTarget("https%3A%2F%2Fevil.example", admin)).toBeNull();
    expect(parseReturnTarget("%2F%2Fevil.example", admin)).toBeNull();
  });

  it("accepts an absolute address on the configured admin origin only", () => {
    expect(
      parseReturnTarget("https://admin.example.com/#/tenants/new", admin),
    ).toBe("https://admin.example.com/#/tenants/new");
    expect(
      parseReturnTarget("https://admin.example.com/#/tenants/new"),
    ).toBeNull();
    expect(
      parseReturnTarget("https://admin.example.com/x", { adminOrigin: null }),
    ).toBeNull();
  });

  it("is not fooled by look-alikes of the admin origin", () => {
    expect(
      parseReturnTarget("https://admin.example.com.evil.example/", admin),
    ).toBeNull();
    expect(
      parseReturnTarget("https://admin.example.com@evil.example/", admin),
    ).toBeNull();
    expect(
      parseReturnTarget("http://admin.example.com/tenants/new", admin),
    ).toBeNull();
    expect(
      parseReturnTarget("https://admin.example.com:8443/", admin),
    ).toBeNull();
    expect(
      parseReturnTarget("https://evil.example\\@admin.example.com/", admin),
    ).toBeNull();
  });
});

describe("resolveReturnTarget", () => {
  it("falls back to the default for anything that is refused", () => {
    expect(resolveReturnTarget("https://evil.example")).toBe("/");
    expect(resolveReturnTarget(undefined, { fallback: "/account" })).toBe(
      "/account",
    );
    expect(resolveReturnTarget("/checkout/7", { fallback: "/account" })).toBe(
      "/checkout/7",
    );
  });
});

describe("isExternalReturnTarget", () => {
  it("tells an admin address from an in-app path", () => {
    expect(isExternalReturnTarget("https://admin.example.com/x")).toBe(true);
    expect(isExternalReturnTarget("/account")).toBe(false);
  });
});

describe("appendReturnTarget", () => {
  it("appends the encoded target as the redirect parameter", () => {
    expect(appendReturnTarget("/login", "/t/guben/bookables/1?a=b")).toBe(
      "/login?redirect=%2Ft%2Fguben%2Fbookables%2F1%3Fa%3Db",
    );
  });

  it("extends an existing query", () => {
    expect(appendReturnTarget("/login?error=sso_failed", "/account")).toBe(
      "/login?error=sso_failed&redirect=%2Faccount",
    );
  });

  it("leaves the path alone when there is no target", () => {
    expect(appendReturnTarget("/login", null)).toBe("/login");
    expect(appendReturnTarget("/register", "")).toBe("/register");
  });
});
