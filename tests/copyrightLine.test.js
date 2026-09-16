import { describe, expect, it } from "vitest";

import { copyrightLine } from "~/utils/copyrightLine.js";

describe("copyrightLine", () => {
  it("names the rights holder after the year when the instance carries one", () => {
    expect(copyrightLine(2026, "Stadt Musterstadt")).toBe(
      "© 2026 Stadt Musterstadt",
    );
  });

  it("is the bare year, with no trailing space, when the copyright is empty", () => {
    expect(copyrightLine(2026, "")).toBe("© 2026");
  });

  it("is the bare year when the field is absent (backend without the field, or no instance)", () => {
    expect(copyrightLine(2026, undefined)).toBe("© 2026");
    expect(copyrightLine(2026, null)).toBe("© 2026");
  });

  it("does not trust a non-string value from the API", () => {
    expect(copyrightLine(2026, 42)).toBe("© 2026");
    expect(copyrightLine(2026, { name: "x" })).toBe("© 2026");
  });

  it("passes markup through as literal text for the template to interpolate", () => {
    expect(copyrightLine(2026, "<b>x</b>")).toBe("© 2026 <b>x</b>");
  });
});
