import { describe, expect, it } from "vitest";

import { forwardedFor } from "~~/shared/utils/forwardedFor";

describe("forwardedFor", () => {
  it("names the connecting address when no proxy is in front", () => {
    expect(forwardedFor(undefined, "203.0.113.7")).toBe("203.0.113.7");
    expect(forwardedFor("", "203.0.113.7")).toBe("203.0.113.7");
  });

  it("appends the connecting address to an existing chain", () => {
    expect(forwardedFor("198.51.100.4", "10.0.0.2")).toBe(
      "198.51.100.4, 10.0.0.2",
    );
    expect(forwardedFor("198.51.100.4, 10.0.0.1 ", "10.0.0.2")).toBe(
      "198.51.100.4, 10.0.0.1, 10.0.0.2",
    );
  });

  it("keeps the chain when the connecting address is unknown", () => {
    expect(forwardedFor("198.51.100.4", undefined)).toBe("198.51.100.4");
  });

  it("answers null when there is nothing to forward", () => {
    expect(forwardedFor(undefined, undefined)).toBeNull();
    expect(forwardedFor("  ", "")).toBeNull();
  });
});
