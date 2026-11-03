import { describe, expect, it } from "vitest";

import { isBusinessContact } from "~/utils/businessBooking.js";

describe("isBusinessContact", () => {
  it("follows the company until the booker sets the checkbox", () => {
    expect(isBusinessContact({ company: "Musterfirma GmbH" })).toBe(true);
    expect(isBusinessContact({ company: "", isBusiness: null })).toBe(false);
    expect(isBusinessContact({ company: "   " })).toBe(false);
    expect(isBusinessContact({})).toBe(false);
  });

  it("keeps the booker's choice over the company", () => {
    expect(
      isBusinessContact({ company: "Musterfirma GmbH", isBusiness: false }),
    ).toBe(false);
    expect(isBusinessContact({ company: "", isBusiness: true })).toBe(true);
  });
});
