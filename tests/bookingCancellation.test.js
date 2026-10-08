import { describe, expect, it } from "vitest";

import {
  CANCELLATION_AVAILABILITY,
  CANCELLATION_FAILURE,
  bookingEndOf,
  cancellationAvailabilityOf,
  cancellationContactHintOf,
  openCancellationRequestOf,
  resolveCancellationFailure,
} from "~/utils/bookingCancellation.js";

const NOW = Date.UTC(2026, 9, 8, 12);
const HOUR = 60 * 60 * 1000;

function bookingOf(overrides = {}) {
  return {
    status: "confirmed",
    priceEur: 20,
    timeBegin: NOW + 24 * HOUR,
    timeEnd: NOW + 26 * HOUR,
    cancellationPolicy: { userCancellable: true },
    ...overrides,
  };
}

/** A refused BFF request as `useApiClient` hands it on. */
function bffError(statusCode, code) {
  return { statusCode, data: { data: code ? { code } : {} } };
}

describe("cancellationAvailabilityOf", () => {
  it.each(["requested", "payment_due", "confirmed"])(
    "offers the cancellation for a live booking (%s)",
    (status) => {
      expect(cancellationAvailabilityOf(bookingOf({ status }), NOW)).toBe(
        CANCELLATION_AVAILABILITY.AVAILABLE,
      );
    },
  );

  it.each(["rejected", "cancelled"])(
    "hides it for a booking that is no longer live (%s)",
    (status) => {
      expect(cancellationAvailabilityOf(bookingOf({ status }), NOW)).toBe(
        CANCELLATION_AVAILABILITY.HIDDEN,
      );
    },
  );

  it("hides it once the booking's end has passed", () => {
    const booking = bookingOf({ timeBegin: NOW - 3 * HOUR, timeEnd: NOW - HOUR });
    expect(cancellationAvailabilityOf(booking, NOW)).toBe(
      CANCELLATION_AVAILABILITY.HIDDEN,
    );
  });

  it("keeps it while a booking that has begun has not ended", () => {
    const booking = bookingOf({ timeBegin: NOW - HOUR, timeEnd: NOW + HOUR });
    expect(cancellationAvailabilityOf(booking, NOW)).toBe(
      CANCELLATION_AVAILABILITY.AVAILABLE,
    );
  });

  it("reads the event's end for an event booking without slot times", () => {
    const base = bookingOf({ timeBegin: undefined, timeEnd: undefined });
    expect(
      cancellationAvailabilityOf({ ...base, eventEnd: NOW + HOUR }, NOW),
    ).toBe(CANCELLATION_AVAILABILITY.AVAILABLE);
    expect(
      cancellationAvailabilityOf({ ...base, eventEnd: NOW - HOUR }, NOW),
    ).toBe(CANCELLATION_AVAILABILITY.HIDDEN);
    expect(
      cancellationAvailabilityOf(
        { ...base, event: { timeEnd: NOW - HOUR } },
        NOW,
      ),
    ).toBe(CANCELLATION_AVAILABILITY.HIDDEN);
  });

  it("blocks it where the tenant's policy says `userCancellable: false`", () => {
    const booking = bookingOf({
      cancellationPolicy: { userCancellable: false },
    });
    expect(cancellationAvailabilityOf(booking, NOW)).toBe(
      CANCELLATION_AVAILABILITY.BLOCKED,
    );
  });

  it("hides rather than blocks a past booking under a forbidding policy", () => {
    const booking = bookingOf({
      timeEnd: NOW - HOUR,
      cancellationPolicy: { userCancellable: false },
    });
    expect(cancellationAvailabilityOf(booking, NOW)).toBe(
      CANCELLATION_AVAILABILITY.HIDDEN,
    );
  });

  it("does not change its answer for an open cancellation request", () => {
    const booking = bookingOf({ hooks: [{ type: "REJECT", timeCreated: NOW }] });
    expect(cancellationAvailabilityOf(booking, NOW)).toBe(
      CANCELLATION_AVAILABILITY.AVAILABLE,
    );
  });
});

describe("bookingEndOf", () => {
  it("prefers the slot end and is null when nothing names an end", () => {
    expect(bookingEndOf({ timeEnd: 5, eventEnd: 9 })).toBe(5);
    expect(bookingEndOf({})).toBeNull();
  });
});

describe("cancellationContactHintOf", () => {
  it("names the tenant's contact hint, trimmed", () => {
    const booking = bookingOf({
      cancellationPolicy: {
        userCancellable: false,
        contactHint: "  Bitte rufen Sie uns an.  ",
      },
    });
    expect(cancellationContactHintOf(booking)).toBe("Bitte rufen Sie uns an.");
  });

  it("is empty without one, so the caller shows its default text", () => {
    expect(
      cancellationContactHintOf(
        bookingOf({ cancellationPolicy: { userCancellable: false } }),
      ),
    ).toBe("");
    expect(cancellationContactHintOf({})).toBe("");
  });
});

describe("openCancellationRequestOf", () => {
  const hook = {
    id: "h1",
    type: "REJECT",
    timeCreated: NOW - HOUR,
    payload: { reason: "Termin verschoben" },
  };

  it("reads a `REJECT` hook on a live booking", () => {
    expect(openCancellationRequestOf(bookingOf({ hooks: [hook] }))).toEqual({
      id: "h1",
      timeCreated: NOW - HOUR,
      reason: "Termin verschoben",
      bankDetails: null,
    });
  });

  it("ignores other hooks and a booking without hooks", () => {
    expect(
      openCancellationRequestOf(bookingOf({ hooks: [{ type: "OTHER" }] })),
    ).toBeNull();
    expect(openCancellationRequestOf(bookingOf())).toBeNull();
  });

  it("treats the hook on a booking that is no longer live as history", () => {
    expect(
      openCancellationRequestOf(bookingOf({ status: "cancelled", hooks: [hook] })),
    ).toBeNull();
  });
});

describe("resolveCancellationFailure", () => {
  it("names the missing reason for 400 `reason_required`", () => {
    expect(resolveCancellationFailure(bffError(400, "reason_required"))).toBe(
      CANCELLATION_FAILURE.REASON,
    );
  });

  it("names the policy for 403 `booking_user_cancellation_disabled`", () => {
    expect(
      resolveCancellationFailure(
        bffError(403, "booking_user_cancellation_disabled"),
      ),
    ).toBe(CANCELLATION_FAILURE.POLICY);
  });

  it.each([409, 404])("names a booking that is gone for %s", (status) => {
    expect(resolveCancellationFailure(bffError(status))).toBe(
      CANCELLATION_FAILURE.GONE,
    );
  });

  it.each([
    ["a 5xx", bffError(502)],
    ["another 400", bffError(400, "validation_failed")],
    ["a 403 without the policy code", bffError(403)],
    ["a network failure", new Error("fetch failed")],
    ["nothing", undefined],
  ])("names nothing for %s, so the form stays", (_, error) => {
    expect(resolveCancellationFailure(error)).toBeNull();
  });
});
