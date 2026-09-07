import { describe, expect, it } from "vitest";

import {
  BOOKING_STATUS,
  isCommittedBooking,
  isLiveBooking,
  isSettledBooking,
  resolveBookingStatus,
  resolveBookingStatusChip,
  resolveBookingStatusKey,
  resolveBookingStatusSearchLabel,
} from "~/utils/bookingStatus.js";

const t = (key) => key;

describe("resolveBookingStatus", () => {
  it("reads the booking state off `status`", () => {
    expect(resolveBookingStatus({ status: "requested" })).toBe(
      BOOKING_STATUS.REQUESTED,
    );
    expect(resolveBookingStatus({ status: "payment_due" })).toBe(
      BOOKING_STATUS.PAYMENT_DUE,
    );
    expect(resolveBookingStatus({ status: "confirmed" })).toBe(
      BOOKING_STATUS.CONFIRMED,
    );
    expect(resolveBookingStatus({ status: "rejected" })).toBe(
      BOOKING_STATUS.REJECTED,
    );
    expect(resolveBookingStatus({ status: "cancelled" })).toBe(
      BOOKING_STATUS.CANCELLED,
    );
  });

  it("trusts `status` over flags that disagree with it", () => {
    expect(
      resolveBookingStatus({
        status: "rejected",
        isCommitted: true,
        isPayed: true,
        isRejected: false,
        priceEur: 10,
      }),
    ).toBe("rejected");
  });

  it("falls back to the flags for a status it does not know instead of throwing", () => {
    expect(
      resolveBookingStatus({
        status: "archived",
        isCommitted: true,
        isPayed: true,
        priceEur: 10,
      }),
    ).toBe("confirmed");
  });

  describe("without a status (the v2 status payload) it derives the state from the flags", () => {
    it.each([
      ["a rejected request", { isRejected: true, isCommitted: false }, "rejected"],
      [
        "a cancelled booking",
        { isRejected: true, isCommitted: true },
        "cancelled",
      ],
      ["an open request", { isCommitted: false }, "requested"],
      [
        "a committed priced booking with payment outstanding",
        { isCommitted: true, priceEur: 10 },
        "payment_due",
      ],
      [
        "a committed priced booking that is paid",
        { isCommitted: true, isPayed: true, priceEur: 10 },
        "confirmed",
      ],
      [
        "a committed free booking",
        { isCommitted: true, priceEur: 0 },
        "confirmed",
      ],
      [
        "the impossible combination paid-but-never-committed of a priced booking",
        { isPayed: true, priceEur: 10 },
        "confirmed",
      ],
    ])("%s", (_name, flags, expected) => {
      expect(resolveBookingStatus(flags)).toBe(expected);
    });
  });
});

describe("resolveBookingStatusKey", () => {
  describe("read off `status`", () => {
    it.each([
      ["requested", 10, "status.awaiting_approval"],
      ["requested", 0, "status.awaiting_approval"],
      ["payment_due", 10, "status.payment_expected"],
      ["payment_due", 0, "status.payment_expected"],
      ["confirmed", 10, "status.paid_completed"],
      ["confirmed", 0, "status.confirmed_without_payment"],
      ["rejected", 10, "status.rejected"],
      ["rejected", 0, "status.rejected"],
      ["cancelled", 10, "status.rejected"],
      ["cancelled", 0, "status.rejected"],
    ])("%s at %d EUR → %s", (status, priceEur, expected) => {
      expect(resolveBookingStatusKey({ status, priceEur })).toBe(expected);
    });

    it("ignores flags that disagree with `status`", () => {
      expect(
        resolveBookingStatusKey({
          status: "confirmed",
          isCommitted: false,
          isPayed: false,
          isRejected: true,
          priceEur: 10,
        }),
      ).toBe("status.paid_completed");
    });
  });

  it("reads the impossible flag combination paid-but-never-committed of a priced booking as paid, like the backend", () => {
    // The one flag reading that changes with 4.3: the flag reader said
    // "awaiting approval", the state model says the payment is the stronger
    // statement (booking-state.js `statusFromFlags`).
    expect(resolveBookingStatusKey({ isPayed: true, priceEur: 10 })).toBe(
      "status.paid_completed",
    );
  });

  it("reads a booking without a price as priced, like isFreeBooking - the flag reader read it as free", () => {
    // The price is unknown, not zero; every payload the storefront reads
    // carries priceEur, so this is the one price question answered once.
    expect(resolveBookingStatusKey({ isCommitted: true, isPayed: true })).toBe(
      "status.paid_completed",
    );
  });

  describe("read off the flags (payloads without a status)", () => {
    // Characterization of the flag reading the storefront had before
    // `booking.status`: the i18n key must not change for any of these.
    it.each([
      // [name, flags, priceEur, expected key]
      ["rejected request", { isRejected: true }, 10, "status.rejected"],
      ["rejected request, free", { isRejected: true }, 0, "status.rejected"],
      [
        "cancelled booking",
        { isCommitted: true, isRejected: true },
        10,
        "status.rejected",
      ],
      [
        "cancelled booking, free",
        { isCommitted: true, isRejected: true },
        0,
        "status.rejected",
      ],
      [
        "cancelled paid booking",
        { isCommitted: true, isPayed: true, isRejected: true },
        10,
        "status.rejected",
      ],
      [
        "cancelled free booking",
        { isCommitted: true, isPayed: true, isRejected: true },
        0,
        "status.rejected",
      ],
      [
        "rejected request with a paid flag",
        { isPayed: true, isRejected: true },
        10,
        "status.rejected",
      ],
      [
        "rejected request with a paid flag, free",
        { isPayed: true, isRejected: true },
        0,
        "status.rejected",
      ],
      ["open request", {}, 10, "status.awaiting_approval"],
      ["open request, free", {}, 0, "status.awaiting_approval"],
      [
        "open request with a paid flag, free",
        { isPayed: true },
        0,
        "status.awaiting_approval",
      ],
      [
        "committed, payment outstanding",
        { isCommitted: true },
        10,
        "status.payment_expected",
      ],
      [
        "committed and paid",
        { isCommitted: true, isPayed: true },
        10,
        "status.paid_completed",
      ],
      [
        "committed, free",
        { isCommitted: true },
        0,
        "status.confirmed_without_payment",
      ],
      [
        "committed, free, paid flag",
        { isCommitted: true, isPayed: true },
        0,
        "status.confirmed_without_payment",
      ],
    ])("%s", (_name, flags, priceEur, expected) => {
      expect(resolveBookingStatusKey({ ...flags, priceEur })).toBe(expected);
    });
  });
});

describe("isLiveBooking", () => {
  it.each([
    ["requested", true],
    ["payment_due", true],
    ["confirmed", true],
    ["rejected", false],
    ["cancelled", false],
  ])("%s → %s", (status, expected) => {
    expect(isLiveBooking({ status })).toBe(expected);
  });

  it("reads a flag-only payload the same way", () => {
    expect(isLiveBooking({ isCommitted: false })).toBe(true);
    expect(isLiveBooking({ isCommitted: true, isRejected: true })).toBe(false);
  });
});

describe("isCommittedBooking", () => {
  it.each([
    ["requested", false],
    ["payment_due", true],
    ["confirmed", true],
    ["rejected", false],
    ["cancelled", false],
  ])("%s → %s", (status, expected) => {
    expect(isCommittedBooking({ status })).toBe(expected);
  });

  it("does not count a cancelled booking as committed even though its flag says so", () => {
    expect(isCommittedBooking({ isCommitted: true, isRejected: true })).toBe(
      false,
    );
  });
});

describe("isSettledBooking", () => {
  it.each([
    ["requested", false],
    ["payment_due", false],
    ["confirmed", true],
    ["rejected", false],
  ])("a priced booking that is %s → %s", (status, expected) => {
    expect(isSettledBooking({ status, priceEur: 10 })).toBe(expected);
  });

  it("is settled for a free booking in every state", () => {
    for (const status of Object.values(BOOKING_STATUS)) {
      expect(isSettledBooking({ status, priceEur: 0 })).toBe(true);
    }
  });

  it("reads a missing price the way isFreeBooking does: unknown is not free", () => {
    expect(isSettledBooking({})).toBe(false);
    expect(isSettledBooking({ status: "payment_due" })).toBe(false);
    expect(isSettledBooking({ status: "confirmed" })).toBe(true);
  });

  describe("a cancelled priced booking", () => {
    it("is settled when it was cancelled from confirmed", () => {
      expect(
        isSettledBooking({
          status: "cancelled",
          priceEur: 10,
          cancellationRefund: { cancelledFrom: "confirmed" },
        }),
      ).toBe(true);
    });

    it("is not settled when it was cancelled from payment_due", () => {
      expect(
        isSettledBooking({
          status: "cancelled",
          priceEur: 10,
          cancellationRefund: { cancelledFrom: "payment_due" },
        }),
      ).toBe(false);
    });

    it("falls back to the paid flag where the payload carries no cancellationRefund", () => {
      expect(
        isSettledBooking({ status: "cancelled", priceEur: 10, isPayed: true }),
      ).toBe(true);
      expect(
        isSettledBooking({ status: "cancelled", priceEur: 10, isPayed: false }),
      ).toBe(false);
    });

    it("reads a flag-only cancelled payload off the paid flag", () => {
      expect(
        isSettledBooking({
          isCommitted: true,
          isRejected: true,
          isPayed: true,
          priceEur: 10,
        }),
      ).toBe(true);
    });
  });
});

describe("resolveBookingStatusChip", () => {
  const GRAY = "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  const GREEN =
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
  const RED = "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";

  it("shows a request as pending with the approval hint", () => {
    expect(resolveBookingStatusChip({ status: "requested" }, t)).toEqual({
      status: "requested",
      label: "booking.status.requested",
      color: GRAY,
      icon: "i-lucide-hourglass",
      tooltip: "booking.status.requestedTooltip",
    });
  });

  it("shows a booking with payment outstanding as confirmed - the payment chip says the rest", () => {
    expect(resolveBookingStatusChip({ status: "payment_due" }, t)).toEqual({
      status: "payment_due",
      label: "booking.status.payment_due",
      color: GREEN,
      icon: "i-lucide-check",
      tooltip: null,
    });
  });

  it("shows a confirmed booking as confirmed", () => {
    expect(resolveBookingStatusChip({ status: "confirmed" }, t)).toEqual({
      status: "confirmed",
      label: "booking.status.confirmed",
      color: GREEN,
      icon: "i-lucide-check",
      tooltip: null,
    });
  });

  it("tells a rejected request from a cancelled booking", () => {
    expect(resolveBookingStatusChip({ status: "rejected" }, t)).toEqual({
      status: "rejected",
      label: "booking.status.rejected",
      color: RED,
      icon: "i-lucide-x",
      tooltip: null,
    });
    expect(resolveBookingStatusChip({ status: "cancelled" }, t)).toEqual({
      status: "cancelled",
      label: "booking.status.cancelled",
      color: RED,
      icon: "i-lucide-x",
      tooltip: null,
    });
  });

  it("reads a flag-only payload through the same table", () => {
    expect(
      resolveBookingStatusChip({ isCommitted: true, isRejected: true }, t),
    ).toMatchObject({ status: "cancelled", label: "booking.status.cancelled" });
  });
});

describe("resolveBookingStatusSearchLabel", () => {
  const german = (key) =>
    ({
      "booking.status.requested": "Ausstehend",
      "booking.status.payment_due": "Bestätigt",
      "booking.status.confirmed": "Bestätigt",
      "booking.status.rejected": "Abgelehnt",
      "booking.status.cancelled": "Storniert",
    })[key];

  it.each([
    ["requested", "ausstehend"],
    ["payment_due", "bestätigt"],
    ["confirmed", "bestätigt"],
    ["rejected", "abgelehnt"],
    ["cancelled", "storniert"],
  ])("%s searches as %s", (status, expected) => {
    expect(resolveBookingStatusSearchLabel({ status }, german)).toBe(expected);
  });
});
