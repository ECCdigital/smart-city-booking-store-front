import { describe, expect, it } from "vitest";

import { bookingSpan, nextBooking, nextKey } from "~/utils/homeGreeting.js";

const HOUR = 60 * 60 * 1000;
const NOW = Date.UTC(2026, 10, 11, 10);

const booking = (id, begin, end, extra = {}) => ({
  id,
  status: "confirmed",
  timeBegin: begin,
  timeEnd: end,
  ...extra,
});

describe("the span of a booking", () => {
  it("reads the booking's own times", () => {
    expect(bookingSpan(booking("A", 1, 2))).toEqual({ begin: 1, end: 2 });
  });

  it("falls back to the event times", () => {
    expect(bookingSpan({ eventBegin: 3, eventEnd: 4 })).toEqual({
      begin: 3,
      end: 4,
    });
  });

  it("is null without times", () => {
    expect(bookingSpan({})).toBeNull();
  });
});

describe("the next booking", () => {
  it("is the live booking that starts first and has not ended", () => {
    const list = [
      booking("later", NOW + 5 * HOUR, NOW + 6 * HOUR),
      booking("past", NOW - 3 * HOUR, NOW - 2 * HOUR),
      booking("soon", NOW + 1 * HOUR, NOW + 2 * HOUR),
    ];
    expect(nextBooking(list, NOW)?.id).toBe("soon");
  });

  it("puts a running booking first", () => {
    const list = [
      booking("soon", NOW + 1 * HOUR, NOW + 2 * HOUR),
      booking("running", NOW - 1 * HOUR, NOW + 1 * HOUR),
    ];
    expect(nextBooking(list, NOW)?.id).toBe("running");
  });

  it("leaves out cancelled and rejected bookings", () => {
    const list = [
      booking("cancelled", NOW + HOUR, NOW + 2 * HOUR, { status: "cancelled" }),
      booking("rejected", NOW + HOUR, NOW + 2 * HOUR, { status: "rejected" }),
    ];
    expect(nextBooking(list, NOW)).toBeNull();
  });

  it("is null for no bookings", () => {
    expect(nextBooking(undefined, NOW)).toBeNull();
  });
});

describe("the next key", () => {
  const keyBooking = (id, from, to) => ({
    id,
    accessEligibility: { accessWindow: { from, to } },
  });

  it("is the open window before one that opens later", () => {
    const result = nextKey(
      [
        keyBooking("later", NOW + 2 * HOUR, NOW + 3 * HOUR),
        keyBooking("open", NOW - HOUR, NOW + HOUR),
      ],
      NOW,
    );
    expect(result?.booking.id).toBe("open");
    expect(result?.state).toBe("during");
  });

  it("is the window that opens next when none is open", () => {
    const result = nextKey(
      [
        keyBooking("far", NOW + 9 * HOUR, NOW + 10 * HOUR),
        keyBooking("near", NOW + 2 * HOUR, NOW + 3 * HOUR),
      ],
      NOW,
    );
    expect(result?.booking.id).toBe("near");
    expect(result?.state).toBe("before");
    expect(result?.window).toEqual({ from: NOW + 2 * HOUR, to: NOW + 3 * HOUR });
  });

  it("is null when every window has closed or there is none", () => {
    expect(
      nextKey(
        [keyBooking("closed", NOW - 3 * HOUR, NOW - HOUR), { id: "none" }],
        NOW,
      ),
    ).toBeNull();
  });
});
