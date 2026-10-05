import { describe, expect, it, vi } from "vitest";

import {
  bookingEventFallback,
  buildEventDateTime,
  enrichBookingsWithEventDateTimes,
  loadCatalogEventsForBookings,
} from "~/utils/bookingEventTimes.js";

const TENANT = "tenant-1";

function eventBooking(id, eventId) {
  return {
    id,
    tenantId: TENANT,
    timeBegin: null,
    timeEnd: null,
    bookableItems: [{ _bookableUsed: { type: "ticket", eventId } }],
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

  it("takes the times from the booking's own event when the catalog has none", async () => {
    // A tenant pending approval or declined is publicly absent: the event
    // route answers 404, the booking answer still names its event.
    const booking = {
      ...eventBooking("a", "event-1"),
      event: {
        id: "event-1",
        title: "Sommerfest",
        timeBegin: 1789920000000,
        timeEnd: 1789927200000,
      },
    };

    const [result] = await enrichBookingsWithEventDateTimes(
      [booking],
      notFound,
    );

    expect(result.eventBegin).toBe(1789920000000);
    expect(result.eventEnd).toBe(1789927200000);
  });

  it("prefers the catalog event's times where the catalog answers", async () => {
    const booking = {
      ...eventBooking("a", "event-1"),
      event: {
        id: "event-1",
        title: "Sommerfest",
        timeBegin: 1789830000000,
        timeEnd: 1789837200000,
      },
    };
    const fetchEventById = vi.fn().mockResolvedValue({
      information: {
        startDate: "2026-09-20",
        startTime: "18:00",
        endDate: "2026-09-20",
        endTime: "20:00",
      },
    });

    const [result] = await enrichBookingsWithEventDateTimes(
      [booking],
      fetchEventById,
    );

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

describe("loadCatalogEventsForBookings", () => {
  it("loads the catalog's events when a ticket booking is listed", async () => {
    const loadBundle = vi.fn().mockResolvedValue({ events: [] });

    const loaded = await loadCatalogEventsForBookings(
      [slotBooking("a"), eventBooking("b", "event-1")],
      loadBundle,
    );

    expect(loaded).toBe(true);
    expect(loadBundle).toHaveBeenCalledWith({ include: ["events"] });
  });

  it("tolerates a bundle that answers 404", async () => {
    // Under /t/:tenantID/... the bundle proxy answers 404 once the tenant is
    // no longer public; the booking list renders without catalog extras.
    const loadBundle = vi.fn().mockRejectedValue({ statusCode: 404 });

    await expect(
      loadCatalogEventsForBookings([eventBooking("a", "event-1")], loadBundle),
    ).resolves.toBe(false);
  });

  it("loads nothing when no booking is a ticket booking", async () => {
    const loadBundle = vi.fn().mockResolvedValue({});

    const loaded = await loadCatalogEventsForBookings(
      [slotBooking("a"), slotBooking("b")],
      loadBundle,
    );

    expect(loaded).toBe(false);
    expect(loadBundle).not.toHaveBeenCalled();
  });
});

describe("bookingEventFallback", () => {
  it("names the booking's own event when the catalog has none", () => {
    const booking = {
      ...eventBooking("a", "event-1"),
      event: {
        id: "event-1",
        title: "Sommerfest",
        timeBegin: 1789920000000,
        timeEnd: 1789927200000,
      },
    };

    expect(bookingEventFallback(booking, [])).toEqual({
      id: "event-1",
      title: "Sommerfest",
      timeBegin: 1789920000000,
      timeEnd: 1789927200000,
    });
  });

  it("names none while the catalog knows the event", () => {
    const booking = {
      ...eventBooking("a", "event-1"),
      event: {
        id: "event-1",
        title: "Sommerfest",
        timeBegin: 1789920000000,
        timeEnd: 1789927200000,
      },
    };
    const catalogEvent = {
      id: "event-1",
      information: { name: "Sommerfest am See", startDate: "2026-09-20" },
    };

    expect(bookingEventFallback(booking, [catalogEvent])).toBeNull();
  });

  it("names none when the booking answer carries no event", () => {
    // `event` is absent on an older backend and `null` once the event is gone.
    const gone = { ...eventBooking("a", "event-1"), event: null };

    expect(bookingEventFallback(eventBooking("a", "event-1"), [])).toBeNull();
    expect(bookingEventFallback(gone, [])).toBeNull();
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
