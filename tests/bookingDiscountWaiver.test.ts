import { describe, expect, it } from "vitest";
import { nextTick, watch } from "vue";

import {
  toDiscountPercent,
  useBookingDiscountWaiver,
} from "~/composables/checkout/useBookingDiscountWaiver";

/**
 * Booking at the regular price despite a role discount (ECCdigital/tickets#494).
 * The checkout validates again whenever the waiver changes, and every
 * validation reports the discount anew, so the waiver must not change with
 * that report. Otherwise each result starts the next validation, without end.
 */
describe("the booking discount waiver", () => {
  it("offers the waiver once a validation reports a discount", () => {
    const { eligibility, hasOption, maxPercent } = useBookingDiscountWaiver();

    expect(hasOption.value).toBe(false);

    eligibility.value = { room: 100, beamer: 30 };

    expect(hasOption.value).toBe(true);
    expect(maxPercent.value).toBe(100);
  });

  it("books with the discount until the user waives it", () => {
    const { eligibility, isWithoutDiscount, selected } =
      useBookingDiscountWaiver();
    eligibility.value = { room: 100 };

    expect(isWithoutDiscount.value).toBe(false);

    selected.value = true;

    expect(selected.value).toBe(true);
    expect(isWithoutDiscount.value).toBe(true);
  });

  it("keeps the waiver while a validation reports no discount yet", async () => {
    const { eligibility, isWithoutDiscount, selected } =
      useBookingDiscountWaiver();
    eligibility.value = { room: 100 };
    selected.value = true;
    await nextTick();

    let changes = 0;
    watch(isWithoutDiscount, () => {
      changes += 1;
    });

    // A series validation starts without a discount and reports it again.
    eligibility.value = {};
    await nextTick();
    eligibility.value = { room: 100 };
    await nextTick();

    expect(isWithoutDiscount.value).toBe(true);
    expect(changes).toBe(0);
  });

  it("forgets the waiver and the discount on reset", () => {
    const { eligibility, isWithoutDiscount, selected, reset } =
      useBookingDiscountWaiver();
    eligibility.value = { room: 100 };
    selected.value = true;

    reset();

    expect(eligibility.value).toEqual({});
    expect(isWithoutDiscount.value).toBe(false);
  });
});

describe("a discount percent", () => {
  it("is a whole number between 0 and 100", () => {
    expect(toDiscountPercent(33.6)).toBe(34);
    expect(toDiscountPercent(150)).toBe(100);
    expect(toDiscountPercent(-5)).toBe(0);
    expect(toDiscountPercent("abc")).toBe(0);
    expect(toDiscountPercent(null)).toBe(0);
  });
});
