import { describe, expect, it } from "vitest";

import {
  formatIban,
  isValidBic,
  isValidIban,
  normalizeBic,
  normalizeIban,
} from "~/utils/iban.js";

describe("IBAN", () => {
  it("normalizes to upper case without whitespace", () => {
    expect(normalizeIban(" de89 3704 0044\t0532 0130 00 ")).toBe(
      "DE89370400440532013000",
    );
    expect(normalizeIban(undefined)).toBe("");
  });

  it("formats in groups of four", () => {
    expect(formatIban("de89370400440532013000")).toBe(
      "DE89 3704 0044 0532 0130 00",
    );
    expect(formatIban("")).toBe("");
  });

  it.each([
    "DE89 3704 0044 0532 0130 00",
    "de89370400440532013000",
    "GB82 WEST 1234 5698 7654 32",
    "AT61 1904 3002 3457 3201",
  ])("accepts a valid IBAN (%s)", (iban) => {
    expect(isValidIban(iban)).toBe(true);
  });

  it.each([
    ["a wrong check digit", "DE88 3704 0044 0532 0130 00"],
    ["a typo in the account", "DE89 3704 0044 0532 0130 01"],
    ["too short", "DE89 3704"],
    ["no country code", "8937 0400 4405 3201 3000"],
    ["empty", ""],
  ])("refuses %s", (_, iban) => {
    expect(isValidIban(iban)).toBe(false);
  });
});

describe("BIC", () => {
  it("normalizes to upper case without whitespace", () => {
    expect(normalizeBic(" cobade ffxxx ")).toBe("COBADEFFXXX");
  });

  it.each(["COBADEFFXXX", "COBADEFF", "markdeff"])(
    "accepts a valid BIC (%s)",
    (bic) => {
      expect(isValidBic(bic)).toBe(true);
    },
  );

  it.each([
    ["too short", "COBADE"],
    ["nine characters", "COBADEFFX"],
    ["a digit in the bank code", "C0BADEFF"],
    ["empty", ""],
  ])("refuses %s", (_, bic) => {
    expect(isValidBic(bic)).toBe(false);
  });
});
