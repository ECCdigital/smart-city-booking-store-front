import { describe, expect, it } from "vitest";

import { BOOKING_STATUS } from "~/utils/bookingStatus.js";
import {
  isPaidBooking,
  isUnpaidBooking,
  resolveBookingPaymentChip,
  resolvePaymentDisplayStatus,
} from "~/utils/bookingPaymentStatus.js";

const t = (key) => key;

describe("resolvePaymentDisplayStatus", () => {
  it("shows a free booking as free in every state", () => {
    for (const status of Object.values(BOOKING_STATUS)) {
      expect(resolvePaymentDisplayStatus({ status, priceEur: 0 })).toBe("free");
    }
  });

  it("shows a confirmed priced booking as paid", () => {
    expect(
      resolvePaymentDisplayStatus({ status: "confirmed", priceEur: 10 }),
    ).toBe("paid");
  });

  it.each(["payment_due", "requested", "rejected"])(
    "shows a priced booking that is %s as unpaid",
    (status) => {
      expect(resolvePaymentDisplayStatus({ status, priceEur: 10 })).toBe(
        "unpaid",
      );
    },
  );

  it("shows a cancelled priced booking by the state it was cancelled from", () => {
    expect(
      resolvePaymentDisplayStatus({
        status: "cancelled",
        priceEur: 10,
        cancellationRefund: { cancelledFrom: "confirmed" },
      }),
    ).toBe("paid");
    expect(
      resolvePaymentDisplayStatus({
        status: "cancelled",
        priceEur: 10,
        cancellationRefund: { cancelledFrom: "payment_due" },
      }),
    ).toBe("unpaid");
  });

  it("does not let a stale paid flag override `status`", () => {
    expect(
      resolvePaymentDisplayStatus({
        status: "payment_due",
        isPayed: true,
        priceEur: 10,
      }),
    ).toBe("unpaid");
  });

  describe("read off the flags (payloads without a status)", () => {
    // Characterization: the display the account showed before `status`.
    it("shows a paid priced booking as paid", () => {
      expect(
        resolvePaymentDisplayStatus({
          isCommitted: true,
          isPayed: true,
          priceEur: 10,
        }),
      ).toBe("paid");
    });

    it("shows an unpaid priced booking as unpaid", () => {
      expect(
        resolvePaymentDisplayStatus({ isCommitted: true, priceEur: 10 }),
      ).toBe("unpaid");
    });

    it("shows a free booking as free whatever the flags say", () => {
      expect(resolvePaymentDisplayStatus({ priceEur: 0 })).toBe("free");
      expect(resolvePaymentDisplayStatus({ isPayed: true, priceEur: 0 })).toBe(
        "free",
      );
    });
  });
});

describe("isPaidBooking / isUnpaidBooking", () => {
  it("agree with the display status", () => {
    const paid = { status: "confirmed", priceEur: 10 };
    const unpaid = { status: "payment_due", priceEur: 10 };

    expect(isPaidBooking(paid)).toBe(true);
    expect(isUnpaidBooking(paid)).toBe(false);
    expect(isPaidBooking(unpaid)).toBe(false);
    expect(isUnpaidBooking(unpaid)).toBe(true);
  });
});

describe("resolveBookingPaymentChip", () => {
  it("labels a booking with payment outstanding as unpaid", () => {
    expect(
      resolveBookingPaymentChip({ status: "payment_due", priceEur: 10 }, t),
    ).toMatchObject({
      status: "unpaid",
      label: "booking.payment.unpaid",
      icon: "i-lucide-hourglass",
    });
  });
});
