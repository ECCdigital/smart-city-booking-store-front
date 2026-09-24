import { describe, expect, it } from "vitest";

import {
  ACCESS_WINDOW_STATES,
  bookingWindow,
  bookingWindowState,
  compareByAccessWindow,
  crossedBoundaries,
  doorWindow,
  findDoor,
  nextBoundary,
  sameLocalDay,
  windowState,
} from "~/utils/accessWindow.js";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

// Local time on purpose: "same day" is the day the person sees.
const NOW = new Date(2026, 8, 17, 9, 0).getTime();

const door = (id, from, to, fields = {}) => ({
  id,
  accessFrom: from,
  accessTo: to,
  ...fields,
});

const booking = (id, window, fields = {}) => ({
  id,
  accessEligibility: { accessWindow: window },
  ...fields,
});

describe("windowState", () => {
  const window = { from: NOW - HOUR, to: NOW + HOUR };

  it("is before, during and after around the window", () => {
    expect(windowState(window, NOW - 2 * HOUR)).toBe(ACCESS_WINDOW_STATES.BEFORE);
    expect(windowState(window, NOW)).toBe(ACCESS_WINDOW_STATES.DURING);
    expect(windowState(window, NOW + 2 * HOUR)).toBe(ACCESS_WINDOW_STATES.AFTER);
  });

  it("opens at the start and closes at the end - the end itself is over", () => {
    // The clock fires *at* the boundary; what it then reads must already be
    // the state on the far side, or the timer would have to fire twice.
    expect(windowState(window, NOW - HOUR)).toBe(ACCESS_WINDOW_STATES.DURING);
    expect(windowState(window, NOW + HOUR)).toBe(ACCESS_WINDOW_STATES.AFTER);
    expect(windowState(window, NOW + HOUR - 1)).toBe(ACCESS_WINDOW_STATES.DURING);
  });

  it("says nothing about a window nobody stated", () => {
    expect(windowState(null, NOW)).toBeNull();
    expect(windowState(undefined, NOW)).toBeNull();
  });
});

describe("doorWindow", () => {
  it("reads the door's own buffered window", () => {
    expect(doorWindow(door("d1", NOW - HOUR, NOW + HOUR))).toEqual({
      from: NOW - HOUR,
      to: NOW + HOUR,
    });
  });

  it("is null for a door without window fields - never half a window", () => {
    expect(doorWindow({ id: "d1" })).toBeNull();
    expect(doorWindow({ id: "d1", accessFrom: NOW })).toBeNull();
    expect(doorWindow({ id: "d1", accessFrom: null, accessTo: NOW })).toBeNull();
    expect(doorWindow({ id: "d1", accessFrom: "soon", accessTo: NOW })).toBeNull();
    expect(doorWindow(null)).toBeNull();
  });
});

describe("findDoor", () => {
  it("finds the door in the booking's access points, ids compared as strings", () => {
    const b = { accessPoints: [door(42, NOW, NOW + HOUR), door("7", NOW, NOW)] };

    expect(findDoor(b, "42")).toBe(b.accessPoints[0]);
    expect(findDoor(b, 7)).toBe(b.accessPoints[1]);
  });

  it("is null where the booking carries no such door", () => {
    expect(findDoor({ accessPoints: [door("1", NOW, NOW)] }, "2")).toBeNull();
    expect(findDoor({}, "1")).toBeNull();
    expect(findDoor(null, "1")).toBeNull();
  });
});

describe("bookingWindow and bookingWindowState", () => {
  it("reads the envelope from the eligibility", () => {
    const b = booking("B1", { from: NOW - HOUR, to: NOW + HOUR });

    expect(bookingWindow(b)).toEqual({ from: NOW - HOUR, to: NOW + HOUR });
    expect(bookingWindowState(b, NOW)).toBe(ACCESS_WINDOW_STATES.DURING);
  });

  it("invents nothing for `accessWindow: null` or a booking without eligibility", () => {
    // A booking without access points gets `accessWindow: null` from the
    // backend; its raw times are not a window and must not stand in for one.
    expect(bookingWindow(booking("B1", null, { timeBegin: NOW, timeEnd: NOW }))).toBeNull();
    expect(bookingWindowState(booking("B1", null), NOW)).toBeNull();
    expect(bookingWindowState({ id: "B2", timeBegin: NOW }, NOW)).toBeNull();
  });
});

describe("compareByAccessWindow", () => {
  const active = (id, from) => booking(id, { from, to: NOW + 3 * HOUR });
  const upcoming = (id, from) => booking(id, { from, to: from + HOUR });
  const past = (id, from) => booking(id, { from, to: from + HOUR });

  it("ranks active before upcoming before past, and a missing envelope last", () => {
    const list = [
      past("past", NOW - 5 * HOUR),
      booking("none", null),
      upcoming("soon", NOW + HOUR),
      active("now", NOW - HOUR),
    ];

    expect(
      [...list].sort(compareByAccessWindow(NOW)).map((b) => b.id),
    ).toEqual(["now", "soon", "past", "none"]);
  });

  it("orders active and upcoming by start ascending, past by start descending", () => {
    const list = [
      active("active-late", NOW - HOUR),
      active("active-early", NOW - 2 * HOUR),
      upcoming("soon-late", NOW + 3 * HOUR),
      upcoming("soon-early", NOW + HOUR),
      past("past-old", NOW - 9 * HOUR),
      past("past-recent", NOW - 3 * HOUR),
    ];

    expect(
      [...list].sort(compareByAccessWindow(NOW)).map((b) => b.id),
    ).toEqual([
      "active-early",
      "active-late",
      "soon-early",
      "soon-late",
      "past-recent",
      "past-old",
    ]);
  });

  it("leaves bookings without an envelope in the order they came", () => {
    const list = [booking("a", null), booking("b", null), booking("c", null)];

    expect([...list].sort(compareByAccessWindow(NOW)).map((b) => b.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });
});

describe("nextBoundary", () => {
  it("is the nearest start or end strictly after now, across all doors", () => {
    const doors = [
      door("a", NOW - HOUR, NOW + 2 * HOUR),
      door("b", NOW + 30 * MINUTE, NOW + 4 * HOUR),
    ];

    expect(nextBoundary(doors, NOW)).toBe(NOW + 30 * MINUTE);
    expect(nextBoundary(doors, NOW + 30 * MINUTE)).toBe(NOW + 2 * HOUR);
    expect(nextBoundary(doors, NOW + 2 * HOUR)).toBe(NOW + 4 * HOUR);
  });

  it("never picks now itself - a boundary just crossed is behind us", () => {
    expect(nextBoundary([door("a", NOW, NOW + HOUR)], NOW)).toBe(NOW + HOUR);
  });

  it("is null once every boundary lies behind, and for doors without windows", () => {
    expect(nextBoundary([door("a", NOW - 2 * HOUR, NOW - HOUR)], NOW)).toBeNull();
    expect(nextBoundary([{ id: "a" }], NOW)).toBeNull();
    expect(nextBoundary([], NOW)).toBeNull();
    expect(nextBoundary(null, NOW)).toBeNull();
  });
});

describe("crossedBoundaries", () => {
  const doors = [
    door("a", NOW + 10 * MINUTE, NOW + 20 * MINUTE),
    door("b", NOW + 20 * MINUTE, NOW + 30 * MINUTE),
  ];

  it("counts the starts and ends between the last look and now, the end inclusive", () => {
    expect(crossedBoundaries(doors, NOW, NOW + 10 * MINUTE)).toEqual({
      starts: 1,
      ends: 0,
    });
    expect(crossedBoundaries(doors, NOW, NOW + 20 * MINUTE)).toEqual({
      starts: 2,
      ends: 1,
    });
    expect(crossedBoundaries(doors, NOW + 20 * MINUTE, NOW + 30 * MINUTE)).toEqual({
      starts: 0,
      ends: 1,
    });
  });

  it("counts nothing where nothing was crossed", () => {
    expect(crossedBoundaries(doors, NOW, NOW + MINUTE)).toEqual({
      starts: 0,
      ends: 0,
    });
    expect(crossedBoundaries([], NOW, NOW + HOUR)).toEqual({ starts: 0, ends: 0 });
  });
});

describe("sameLocalDay", () => {
  it("is true within one local calendar day and false across midnight", () => {
    const morning = new Date(2026, 8, 17, 0, 5).getTime();
    const night = new Date(2026, 8, 17, 23, 55).getTime();
    const nextDay = new Date(2026, 8, 18, 0, 5).getTime();

    expect(sameLocalDay(morning, night)).toBe(true);
    expect(sameLocalDay(night, nextDay)).toBe(false);
  });
});
