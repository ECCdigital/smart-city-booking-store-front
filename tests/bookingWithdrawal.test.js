import { describe, expect, it } from "vitest";

import { withdrawalUrlOf } from "~/utils/bookingWithdrawal.js";

const MAILTO =
  "mailto:amt@stadt.de?subject=Widerruf%20der%20Buchung%20B-1&body=Sehr%20geehrte%20Damen%20und%20Herren";

function bookingOf(overrides = {}) {
  return { id: "B-1", status: "confirmed", withdrawalUrl: MAILTO, ...overrides };
}

describe("withdrawalUrlOf", () => {
  it("answers the backend's mail for a live booking", () => {
    expect(withdrawalUrlOf(bookingOf())).toBe(MAILTO);
    expect(withdrawalUrlOf(bookingOf({ status: "requested" }))).toBe(MAILTO);
    expect(withdrawalUrlOf(bookingOf({ status: "payment_due" }))).toBe(MAILTO);
  });

  it("answers null where the backend offers none (company, after 14 days)", () => {
    expect(withdrawalUrlOf(bookingOf({ withdrawalUrl: null }))).toBeNull();
    expect(withdrawalUrlOf(bookingOf({ withdrawalUrl: undefined }))).toBeNull();
  });

  it("answers null for a booking that is no longer live", () => {
    expect(withdrawalUrlOf(bookingOf({ status: "cancelled" }))).toBeNull();
    expect(withdrawalUrlOf(bookingOf({ status: "rejected" }))).toBeNull();
    expect(withdrawalUrlOf(bookingOf({ status: "withdrawn" }))).toBeNull();
  });

  it("opens nothing but a mail", () => {
    expect(
      withdrawalUrlOf(bookingOf({ withdrawalUrl: "https://example.test" })),
    ).toBeNull();
  });
});
