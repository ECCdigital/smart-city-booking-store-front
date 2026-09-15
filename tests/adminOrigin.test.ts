import { describe, expect, it } from "vitest";

import { adminOrigin } from "~~/shared/utils/adminOrigin";

describe("adminOrigin", () => {
  it("reduces the admin base URL to its origin", () => {
    expect(adminOrigin("https://admin.example.com")).toBe(
      "https://admin.example.com",
    );
    expect(adminOrigin("https://admin.example.com/portal/")).toBe(
      "https://admin.example.com",
    );
    expect(adminOrigin("http://localhost:8080/#/hero")).toBe(
      "http://localhost:8080",
    );
  });

  it("keeps an explicit port and drops a default one", () => {
    expect(adminOrigin("https://admin.example.com:8443/")).toBe(
      "https://admin.example.com:8443",
    );
    expect(adminOrigin("https://admin.example.com:443/")).toBe(
      "https://admin.example.com",
    );
  });

  it("answers null when the variable is unset or blank", () => {
    expect(adminOrigin(undefined)).toBeNull();
    expect(adminOrigin(null)).toBeNull();
    expect(adminOrigin("")).toBeNull();
    expect(adminOrigin("   ")).toBeNull();
  });

  it("answers null for anything that is not an http(s) URL", () => {
    expect(adminOrigin("admin.example.com")).toBeNull();
    expect(adminOrigin("not a url")).toBeNull();
    expect(adminOrigin("javascript:alert(1)")).toBeNull();
    expect(adminOrigin("file:///etc/passwd")).toBeNull();
    expect(adminOrigin(42)).toBeNull();
  });
});
