import { describe, expect, it } from "vitest";

import {
  reachedPerBookingLimit,
  resolveMaxAmount,
  resolvePerBookingLimit,
} from "~/utils/amountLimits";

describe("resolveMaxAmount", () => {
  it("caps by capacity alone when no per-booking limit is set", () => {
    expect(resolveMaxAmount({ amount: 10 })).toBe(10);
    expect(resolveMaxAmount({ amount: 10, maxAmountPerBooking: null })).toBe(
      10,
    );
  });

  it("caps by the per-booking limit alone when capacity is unlimited", () => {
    expect(resolveMaxAmount({ maxAmountPerBooking: 3 })).toBe(3);
    expect(resolveMaxAmount({ amount: 0, maxAmountPerBooking: 3 })).toBe(3);
    expect(resolveMaxAmount({ amount: null, maxAmountPerBooking: 3 })).toBe(3);
  });

  it("takes the stricter of the two limits", () => {
    expect(resolveMaxAmount({ amount: 10, maxAmountPerBooking: 3 })).toBe(3);
    expect(resolveMaxAmount({ amount: 2, maxAmountPerBooking: 3 })).toBe(2);
    expect(resolveMaxAmount({ amount: 3, maxAmountPerBooking: 3 })).toBe(3);
  });

  it("answers null when neither limit applies", () => {
    expect(resolveMaxAmount({})).toBeNull();
    expect(resolveMaxAmount({ amount: 0, maxAmountPerBooking: 0 })).toBeNull();
    expect(resolveMaxAmount({ amount: -1 })).toBeNull();
    expect(resolveMaxAmount(null)).toBeNull();
  });

  it("reads a numeric string capacity like the backend may send it", () => {
    expect(resolveMaxAmount({ amount: "5", maxAmountPerBooking: 4 })).toBe(4);
  });

  it("leaves a mandatory add-on to its capacity", () => {
    expect(
      resolveMaxAmount(
        { amount: 10, maxAmountPerBooking: 3 },
        { mandatory: true },
      ),
    ).toBe(10);
    expect(
      resolveMaxAmount({ maxAmountPerBooking: 3 }, { mandatory: true }),
    ).toBeNull();
  });
});

describe("resolvePerBookingLimit", () => {
  it("answers the positive per-booking limit of a chosen position", () => {
    expect(resolvePerBookingLimit({ maxAmountPerBooking: 3 })).toBe(3);
  });

  it("answers null for unlimited and for mandatory add-ons", () => {
    expect(resolvePerBookingLimit({ maxAmountPerBooking: null })).toBeNull();
    expect(resolvePerBookingLimit({ maxAmountPerBooking: 0 })).toBeNull();
    expect(resolvePerBookingLimit({})).toBeNull();
    expect(
      resolvePerBookingLimit({ maxAmountPerBooking: 3 }, { mandatory: true }),
    ).toBeNull();
  });
});

describe("reachedPerBookingLimit", () => {
  it("names the limit once a position sits at a per-booking cap", () => {
    expect(reachedPerBookingLimit(3, 3, 3)).toBe(3);
  });

  it("stays silent below the cap", () => {
    expect(reachedPerBookingLimit(2, 3, 3)).toBeNull();
  });

  it("stays silent when capacity is the stricter limit", () => {
    // Capacity 2, per booking 3: the stepper stops at 2 for want of units,
    // which the capacity hint explains, not this one.
    expect(reachedPerBookingLimit(2, 2, 3)).toBeNull();
  });

  it("counts a per-booking limit equal to capacity as reached", () => {
    expect(reachedPerBookingLimit(5, 5, 5)).toBe(5);
  });

  it("stays silent without a cap or without a per-booking limit", () => {
    expect(reachedPerBookingLimit(4, null, null)).toBeNull();
    expect(reachedPerBookingLimit(4, 4, null)).toBeNull();
    expect(reachedPerBookingLimit(4, 4, undefined)).toBeNull();
  });
});
