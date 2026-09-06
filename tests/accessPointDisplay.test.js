import { describe, expect, it } from "vitest";

import {
  ACCESS_POINT_LOCK_STATES,
  ACCESS_POINT_MODES,
  UNKNOWN_MODE,
  accessPointLock,
  accessPointMode,
  accessPointTitle,
} from "~/utils/accessPointDisplay.js";

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

describe("accessPointMode", () => {
  it("gives each known mode its own badge", () => {
    expect(accessPointMode({ mode: "remote" })).toBe(
      ACCESS_POINT_MODES.remote,
    );
    expect(accessPointMode({ mode: "code" })).toBe(ACCESS_POINT_MODES.code);
  });

  it("names a code door by what the backend calls it", () => {
    // `authorization` is the backend's word for a door that takes a code or a
    // card; `code` was never sent by any backend and stays as an alias.
    expect(accessPointMode({ mode: "authorization" }).label).toBe(
      "Code an der Tür",
    );
    expect(accessPointMode({ mode: "code" }).label).toBe("Code an der Tür");
  });

  it("gives a door that takes both ways a badge of its own", () => {
    const badge = accessPointMode({ mode: "both" });

    expect(badge).not.toBe(UNKNOWN_MODE);
    expect(badge.label).toBe("Per Knopf oder Code");
    expect(badge).toMatchObject({
      color: expect.any(String),
      icon: expect.stringMatching(/^i-lucide-/),
    });
  });

  it("says unknown out loud rather than leaving the badge blank", () => {
    expect(accessPointMode({ mode: "carrier-pigeon" })).toBe(UNKNOWN_MODE);
    expect(accessPointMode({})).toBe(UNKNOWN_MODE);
    expect(accessPointMode(null)).toBe(UNKNOWN_MODE);
  });

  it("hands out a badge with every field a renderer reads", () => {
    for (const badge of [...Object.values(ACCESS_POINT_MODES), UNKNOWN_MODE]) {
      expect(badge).toMatchObject({
        label: expect.any(String),
        color: expect.any(String),
        icon: expect.stringMatching(/^i-lucide-/),
      });
    }
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
        label: expect.any(String),
        color: expect.any(String),
        background: expect.any(String),
        icon: expect.stringMatching(/^i-lucide-/),
      });
    }
  });
});
