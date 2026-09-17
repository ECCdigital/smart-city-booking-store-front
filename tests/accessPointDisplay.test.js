import { describe, expect, it } from "vitest";

import {
  ACCESS_POINT_LOCK_STATES,
  accessPointLock,
  accessPointTitle,
  accessWindowLine,
  needsCodeAtDoor,
} from "~/utils/accessPointDisplay.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Local time on purpose: "same day" is the day the person sees.
const NOW = new Date(2026, 8, 17, 9, 0).getTime();

describe("accessPointTitle", () => {
  it("names a bike box by the number written on it", () => {
    // `compartment` is what the person looks for at the site; the provider's
    // booking id is not on the box.
    expect(
      accessPointTitle({
        type: "locker",
        compartment: "12",
        externalBookingId: 4711,
      }),
    ).toBe("Fahrradbox Nr. 12");
  });

  it("falls back to the booking behind a box the provider did not number", () => {
    expect(
      accessPointTitle({
        type: "locker",
        compartment: null,
        externalBookingId: 4711,
      }),
    ).toBe("Fahrradbox #4711");
  });

  it("names a box on hold plainly rather than by a null", () => {
    // Before the grant - an unpaid booking - the provider knows neither a
    // number nor a booking id; `#null` is not a name.
    expect(
      accessPointTitle({
        type: "locker",
        compartment: null,
        externalBookingId: null,
      }),
    ).toBe("Fahrradbox");
  });

  it("lets type decide, not provider", () => {
    // The same provider that runs the lockers also runs doors; #13, #15.
    expect(
      accessPointTitle({
        type: "door",
        provider: "ifbs",
        label: "Nebeneingang",
        externalBookingId: 4711,
      }),
    ).toBe("Nebeneingang");
  });

  it("names a door from a provider nobody enumerated", () => {
    // The old label rendered nothing at all outside its two known providers.
    expect(accessPointTitle({ type: "door", provider: "whoever" })).toBe(
      "Unbekannte Tür",
    );
  });

  it("survives an access point that is not there yet", () => {
    expect(accessPointTitle(null)).toBe("Unbekannte Tür");
  });
});

describe("needsCodeAtDoor", () => {
  it("tells the person about the code where the button alone will not do", () => {
    // `authorization` is the backend's word for a door that takes a code or a
    // card; `code` was never sent by any backend and stays as an alias.
    expect(needsCodeAtDoor({ mode: "authorization" })).toBe(true);
    expect(needsCodeAtDoor({ mode: "code" })).toBe(true);
  });

  it("says nothing where the button is the way", () => {
    expect(needsCodeAtDoor({ mode: "remote" })).toBe(false);
    expect(needsCodeAtDoor({ mode: "both" })).toBe(false);
  });

  it("does not send a person to a keypad it cannot vouch for", () => {
    // An unknown or missing mode is not a code door; a wrong instruction is
    // worse than none.
    expect(needsCodeAtDoor({ mode: "carrier-pigeon" })).toBe(false);
    expect(needsCodeAtDoor({})).toBe(false);
    expect(needsCodeAtDoor(null)).toBe(false);
    expect(needsCodeAtDoor(undefined)).toBe(false);
  });
});

describe("accessWindowLine", () => {
  const door = (from, to) => ({ id: "d1", accessFrom: from, accessTo: to });

  it("says 'Zugang ab' with the start before the window", () => {
    expect(accessWindowLine(door(NOW + HOUR, NOW + 3 * HOUR), NOW)).toEqual({
      state: "before",
      at: NOW + HOUR,
      withDate: false,
    });
  });

  it("says 'möglich bis' with the end during the window", () => {
    expect(accessWindowLine(door(NOW - HOUR, NOW + HOUR), NOW)).toEqual({
      state: "during",
      at: NOW + HOUR,
      withDate: false,
    });
  });

  it("says 'endete um' with the end after the window", () => {
    expect(accessWindowLine(door(NOW - 3 * HOUR, NOW - HOUR), NOW)).toEqual({
      state: "after",
      at: NOW - HOUR,
      withDate: false,
    });
  });

  it("adds the date when the moment is not today", () => {
    expect(accessWindowLine(door(NOW + DAY, NOW + DAY + HOUR), NOW)).toMatchObject({
      state: "before",
      withDate: true,
    });
    expect(accessWindowLine(door(NOW - 2 * DAY, NOW - DAY), NOW)).toMatchObject({
      state: "after",
      withDate: true,
    });
    // A window that ends tonight is stated by the time alone.
    expect(accessWindowLine(door(NOW - HOUR, NOW + 14 * HOUR), NOW)).toMatchObject({
      state: "during",
      withDate: false,
    });
  });

  it("says nothing for a door without window fields", () => {
    // No invented dates: a row without a window has no line, not a wrong one.
    expect(accessWindowLine({ id: "d1" }, NOW)).toBeNull();
    expect(accessWindowLine({ id: "d1", accessFrom: NOW }, NOW)).toBeNull();
    expect(accessWindowLine(null, NOW)).toBeNull();
  });
});

describe("accessPointLock", () => {
  it("says nothing about a door nobody has asked about yet", () => {
    expect(accessPointLock(undefined)).toBe(ACCESS_POINT_LOCK_STATES.unknown);
  });

  it("says nothing about a door whose provider says nothing", () => {
    // `readStatus` answers `null` for a status read that found no status, and
    // an object of four nulls for a provider that names none of the fields.
    expect(accessPointLock(null)).toBe(ACCESS_POINT_LOCK_STATES.unknown);
    expect(
      accessPointLock({
        open: null,
        locked: null,
        doorOpen: null,
        statusSource: null,
      }),
    ).toBe(ACCESS_POINT_LOCK_STATES.unknown);
  });

  it("reads an answer the way the flow reads it", () => {
    expect(accessPointLock({ open: true, locked: null })).toBe(
      ACCESS_POINT_LOCK_STATES.open,
    );
    expect(accessPointLock({ open: false, locked: null })).toBe(
      ACCESS_POINT_LOCK_STATES.closed,
    );
    expect(accessPointLock({ open: null, locked: false })).toBe(
      ACCESS_POINT_LOCK_STATES.open,
    );
    expect(accessPointLock({ open: null, locked: true })).toBe(
      ACCESS_POINT_LOCK_STATES.closed,
    );
  });

  it("lets `open` outrank `locked`, as the flow does", () => {
    // A lock mid-turn answers `locked: false` whichever way it is turning;
    // #07 of the previous card. `isUnlocked` owns that ranking, and this
    // reader must not grow a second opinion about it.
    expect(accessPointLock({ open: false, locked: false })).toBe(
      ACCESS_POINT_LOCK_STATES.closed,
    );
    expect(accessPointLock({ open: true, locked: true })).toBe(
      ACCESS_POINT_LOCK_STATES.open,
    );
  });

  it("hands out a symbol with every field a renderer reads", () => {
    for (const state of Object.values(ACCESS_POINT_LOCK_STATES)) {
      expect(state).toMatchObject({
        labelKey: expect.stringMatching(/^mobileKey\.accessPoint\.lockState\./),
        color: expect.any(String),
        background: expect.any(String),
        icon: expect.stringMatching(/^i-lucide-/),
      });
    }
  });
});
