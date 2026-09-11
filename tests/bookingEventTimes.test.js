import { describe, expect, it, vi } from "vitest";

import {
  buildEventDateTime,
  enrichBookingsWithEventDateTimes,
} from "~/utils/bookingEventTimes.js";

const TENANT = "tenant-1";

function eventBooking(id, eventId) {
  return {
    id,
    tenantId: TENANT,
    timeBegin: null,
    timeEnd: null,
    bookableItems: [{ _bookableUsed: { eventId } }],
  };
}

function slotBooking(id) {
  return { id, tenantId: TENANT, timeBegin: 1, timeEnd: 2, bookableItems: [] };
}

const notFound = () =>
  Promise.reject({ statusCode: 404, statusMessage: "Failed to fetch event data" });

describe("enrichBookingsWithEventDateTimes", () => {
  it("keeps every booking when an event lookup fails", async () => {
    // Regression: one 404 from the event endpoint rejected the whole
    // Promise.all, so /account/bookings rendered the empty state.
    const bookings = [
      slotBooking("a"),
      eventBooking("b", "missing-event"),
      slotBooking("c"),
    ];

    const result = await enrichBookingsWithEventDateTimes(bookings, notFound);

    expect(result.map((b) => b.id)).toEqual(["a", "b", "c"]);
    expect(result[1].eventBegin).toBeUndefined();
    expect(result[1].eventEnd).toBeUndefined();
  });

  it("adds event times to bookings without slot times", async () => {
    const fetchEventById = vi.fn().mockResolvedValue({
      information: {
        startDate: "2026-09-20",
        startTime: "18:00",
        endDate: "2026-09-20",
        endTime: "20:00",
      },
    });

    const [result] = await enrichBookingsWithEventDateTimes(
      [eventBooking("a", "event-1")],
      fetchEventById,
    );

    expect(fetchEventById).toHaveBeenCalledWith(TENANT, "event-1");
    expect(result.eventBegin).toBe(new Date("2026-09-20T18:00").getTime());
    expect(result.eventEnd).toBe(new Date("2026-09-20T20:00").getTime());
  });

  it("fetches each event once even when bookings share it", async () => {
    const fetchEventById = vi.fn().mockResolvedValue({ information: {} });

    await enrichBookingsWithEventDateTimes(
      [
        eventBooking("a", "event-1"),
        eventBooking("b", "event-1"),
        eventBooking("c", "event-1"),
      ],
      fetchEventById,
    );

    expect(fetchEventById).toHaveBeenCalledTimes(1);
  });

  it("leaves bookings with slot times and bookings without an event untouched", async () => {
    const fetchEventById = vi.fn();
    const plain = { id: "x", tenantId: TENANT, timeBegin: null, timeEnd: null };

    const result = await enrichBookingsWithEventDateTimes(
      [slotBooking("a"), plain],
      fetchEventById,
    );

    expect(result).toEqual([slotBooking("a"), plain]);
    expect(fetchEventById).not.toHaveBeenCalled();
  });

  it("passes empty and non-array input through", async () => {
    expect(await enrichBookingsWithEventDateTimes([], vi.fn())).toEqual([]);
    expect(await enrichBookingsWithEventDateTimes(null, vi.fn())).toBeNull();
  });
});

describe("buildEventDateTime", () => {
  it("returns null without a date", () => {
    expect(buildEventDateTime(null, "10:00")).toBeNull();
  });

  it("defaults to midnight without a time", () => {
    expect(buildEventDateTime("2026-09-20")).toBe(
      new Date("2026-09-20T00:00:00").getTime(),
    );
  });

  it("returns null for an unparsable date", () => {
    expect(buildEventDateTime("nope", "10:00")).toBeNull();
  });
});
