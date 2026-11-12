import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

import {
  ACCESS_POINT_LOCK_STATES,
  accessPointLock,
  accessPointName,
  accessPointTitle,
  accessWindowLine,
  compartmentOf,
  compartmentPlace,
  needsCodeAtDoor,
  scanPageWording,
} from "~/utils/accessPointDisplay.js";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// Local time on purpose: "same day" is the day the person sees.
const NOW = new Date(2026, 8, 17, 9, 0).getTime();

function translator(locale) {
  return createI18n({ legacy: false, locale, messages: { de, en } }).global.t;
}

const t = translator("de");

describe("accessPointTitle", () => {
  it("names a bike box by the number written on it", () => {
    // `compartment` is what the person looks for at the site; the provider's
    // booking id is not on the box.
    expect(
      accessPointTitle(
        {
          type: "locker",
          compartment: "12",
          externalBookingId: 4711,
        },
        t,
      ),
    ).toBe("Fahrradbox Nr. 12");
  });

  it("falls back to the booking behind a box the provider did not number", () => {
    expect(
      accessPointTitle(
        {
          type: "locker",
          compartment: null,
          externalBookingId: 4711,
        },
        t,
      ),
    ).toBe("Fahrradbox #4711");
  });

  it("names a box on hold plainly rather than by a null", () => {
    // Before the grant - an unpaid booking - the provider knows neither a
    // number nor a booking id; `#null` is not a name.
    expect(
      accessPointTitle(
        {
          type: "locker",
          compartment: null,
          externalBookingId: null,
        },
        t,
      ),
    ).toBe("Fahrradbox");
  });

  describe("a Fach the platform assigned (Open Locker)", () => {
    const assignedFach = (overrides = {}) => ({
      id: "anlage-1:9b2f6c1e",
      type: "locker",
      provider: "open-locker",
      label: "Fächer Bahnhof",
      compartment: null,
      externalBookingId: null,
      assignedCompartment: {
        number: 3,
        lockerBankName: "Quartiersschrank Hafen",
      },
      ...overrides,
    });

    it("names it by Anlage, Schließfachschrank and number - not a bike box", () => {
      expect(accessPointTitle(assignedFach(), t)).toBe(
        "Fächer Bahnhof — Schrank Quartiersschrank Hafen, Fach 3",
      );
    });

    it("names it by Anlage and number where the Schließfachschrank is unknown", () => {
      expect(
        accessPointTitle(
          assignedFach({
            assignedCompartment: { number: 3, lockerBankName: null },
          }),
          t,
        ),
      ).toBe("Fächer Bahnhof — Fach 3");
    });

    it("names it in the language of the page", () => {
      expect(accessPointTitle(assignedFach(), translator("en"))).toBe(
        "Fächer Bahnhof — cabinet Quartiersschrank Hafen, compartment 3",
      );
    });

    it("calls an Anlage without a label a Schließfachanlage, never a bike box - that is iFBS alone", () => {
      expect(accessPointTitle(assignedFach({ label: "" }), t)).toBe(
        "Schließfachanlage — Schrank Quartiersschrank Hafen, Fach 3",
      );
      expect(
        accessPointTitle(assignedFach({ label: "" }), translator("en")),
      ).toBe("Locker system — cabinet Quartiersschrank Hafen, compartment 3");
    });

    it("keeps the fixed Fach a door with its label", () => {
      expect(
        accessPointTitle(
          {
            type: "door",
            provider: "open-locker",
            label: "Quartiersschrank Hafen · Fach 3",
          },
          t,
        ),
      ).toBe("Quartiersschrank Hafen · Fach 3");
    });
  });

  describe("a Fach as resolve-scan names it (Open Locker)", () => {
    // resolve-scan sends the Fach as `compartment`, an object - unlike the
    // box number string iFBS names in a booking's projection.
    const scannedFach = (overrides = {}) => ({
      id: "anlage-1:9b2f6c1e",
      lockerSystemId: "anlage-1",
      type: "locker",
      provider: "open-locker",
      label: "Fächer Bahnhof",
      compartment: {
        number: 3,
        lockerBankName: "Quartiersschrank Hafen",
        outOfService: false,
      },
      ...overrides,
    });

    it("names it by Anlage, Schließfachschrank and number - not a bike box", () => {
      expect(accessPointTitle(scannedFach(), t)).toBe(
        "Fächer Bahnhof — Schrank Quartiersschrank Hafen, Fach 3",
      );
    });

    it("names it the same way out of service - the page makes no case of it", () => {
      expect(
        accessPointTitle(
          scannedFach({
            compartment: {
              number: 3,
              lockerBankName: "Quartiersschrank Hafen",
              outOfService: true,
            },
          }),
          t,
        ),
      ).toBe("Fächer Bahnhof — Schrank Quartiersschrank Hafen, Fach 3");
    });

    it("names it by Anlage and number where the Schließfachschrank is unknown", () => {
      expect(
        accessPointTitle(
          scannedFach({ compartment: { number: 3, lockerBankName: null } }),
          t,
        ),
      ).toBe("Fächer Bahnhof — Fach 3");
    });

    it("names it in the language of the page", () => {
      expect(accessPointTitle(scannedFach(), translator("en"))).toBe(
        "Fächer Bahnhof — cabinet Quartiersschrank Hafen, compartment 3",
      );
    });

    it("gives the error screens the same name", () => {
      expect(accessPointName(scannedFach(), t)).toBe(
        "Fächer Bahnhof — Schrank Quartiersschrank Hafen, Fach 3",
      );
    });

    it("keeps a box number string the iFBS bike box", () => {
      expect(
        accessPointTitle(
          { type: "locker", label: "Radstation", compartment: "12" },
          t,
        ),
      ).toBe("Fahrradbox Nr. 12");
    });
  });

  it("lets type decide, not provider", () => {
    // The same provider that runs the lockers also runs doors; #13, #15.
    expect(
      accessPointTitle(
        {
          type: "door",
          provider: "ifbs",
          label: "Nebeneingang",
          externalBookingId: 4711,
        },
        t,
      ),
    ).toBe("Nebeneingang");
  });

  it("names a door from a provider nobody enumerated", () => {
    // The old label rendered nothing at all outside its two known providers.
    expect(accessPointTitle({ type: "door", provider: "whoever" }, t)).toBe(
      "Unbekannte Tür",
    );
  });

  it("survives an access point that is not there yet", () => {
    expect(accessPointTitle(null, t)).toBe("Unbekannte Tür");
  });

  it("names boxes and doors in the language of the page", () => {
    const english = translator("en");

    expect(
      accessPointTitle({ type: "locker", compartment: "12" }, english),
    ).toBe("Bike box no. 12");
    expect(
      accessPointTitle({ type: "locker", externalBookingId: 4711 }, english),
    ).toBe("Bike box #4711");
    expect(accessPointTitle({ type: "locker" }, english)).toBe("Bike box");
    expect(accessPointTitle(null, english)).toBe("Unknown door");
  });
});

/** What the scan landing page says around the place the sticker named. */
describe("scanPageWording", () => {
  it("speaks of the Fach where the scan resolved to one", () => {
    expect(
      scanPageWording({ id: "anlage-1:fach-3", lockerSystemId: "anlage-1" }, t),
    ).toEqual({
      title: "Fach öffnen",
      description: "Sie haben den Code am Fach gescannt.",
      severalBookingsMatch:
        "Mehrere Ihrer Buchungen passen gerade zu diesem Fach.",
    });
  });

  it("speaks of the door otherwise", () => {
    expect(scanPageWording({ id: "door-1", type: "door" }, t)).toEqual({
      title: "Tür öffnen",
      description: "Sie haben den Code an der Tür gescannt.",
      severalBookingsMatch:
        "Mehrere Ihrer Buchungen passen gerade zu dieser Tür.",
    });
  });

  it("speaks of the door while nothing is resolved yet", () => {
    expect(scanPageWording(null, t).title).toBe("Tür öffnen");
  });

  it("speaks the language of the page", () => {
    expect(
      scanPageWording(
        { id: "anlage-1:fach-3", lockerSystemId: "anlage-1" },
        translator("en"),
      ),
    ).toEqual({
      title: "Open the compartment",
      description: "You scanned the code at the compartment.",
      severalBookingsMatch:
        "Several of your bookings match this compartment right now.",
    });
  });
});

/**
 * The short form of a Fach for a sentence that has already named the Anlage
 * or names Fächer side by side - „Ihr Fach: Schrank X, Fach N“.
 */
describe("compartmentPlace", () => {
  it("names the Schließfachschrank and the number, without the Anlage", () => {
    expect(
      compartmentPlace({ number: 3, lockerBankName: "Labor Fachbank 1" }, t),
    ).toBe("Schrank Labor Fachbank 1, Fach 3");
  });

  it("names the number alone where the Schließfachschrank is unknown", () => {
    expect(compartmentPlace({ number: 3, lockerBankName: null }, t)).toBe(
      "Fach 3",
    );
  });

  it("speaks the language of the page", () => {
    const english = translator("en");

    expect(
      compartmentPlace(
        { number: 3, lockerBankName: "Labor Fachbank 1" },
        english,
      ),
    ).toBe("cabinet Labor Fachbank 1, compartment 3");
    expect(compartmentPlace({ number: 3 }, english)).toBe("compartment 3");
  });

  it("says nothing without a number", () => {
    expect(compartmentPlace(null, t)).toBeNull();
    expect(compartmentPlace({ number: null }, t)).toBeNull();
  });

  it("takes the Fach of a booking and of a scan alike", () => {
    const fromBooking = compartmentOf({
      type: "locker",
      compartment: null,
      assignedCompartment: { number: 3, lockerBankName: "Labor Fachbank 1" },
    });
    const fromScan = compartmentOf({
      type: "locker",
      compartment: {
        number: 7,
        lockerBankName: "Labor Fachbank 1",
        outOfService: false,
      },
    });

    expect(compartmentPlace(fromBooking, t)).toBe(
      "Schrank Labor Fachbank 1, Fach 3",
    );
    expect(compartmentPlace(fromScan, t)).toBe(
      "Schrank Labor Fachbank 1, Fach 7",
    );
  });

  it("reads no Fach from an iFBS box or a door", () => {
    expect(compartmentOf({ type: "locker", compartment: "12" })).toBeNull();
    expect(compartmentOf({ type: "door", label: "Haupteingang" })).toBeNull();
  });
});

/**
 * The name the open sheet and its stages say: the Fach the platform
 * assigned by Anlage, Schrank and number, any other door by its label.
 */
describe("accessPointName", () => {
  it("names an assigned Fach by Anlage, Schließfachschrank and number", () => {
    expect(
      accessPointName(
        {
          type: "locker",
          label: "Fächer Bahnhof",
          assignedCompartment: { number: 3, lockerBankName: "Hafen" },
        },
        t,
      ),
    ).toBe("Fächer Bahnhof — Schrank Hafen, Fach 3");
  });

  it("names any other door by its label, a bike box too", () => {
    expect(accessPointName({ type: "door", label: "Nebeneingang" }, t)).toBe(
      "Nebeneingang",
    );
    expect(
      accessPointName({ type: "locker", label: "Box 7", compartment: "7" }, t),
    ).toBe("Box 7");
  });

  it("falls back to „Der Zugang“ without a label", () => {
    expect(accessPointName({ type: "door" }, t)).toBe("Der Zugang");
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

describe("the scanner's word for another Fach of the same Anlage", () => {
  // How `AccessPointScanEvidence.vue` puts it together: both Fächer in the
  // short form, the scanned one first.
  const said = (translate, scanned, own) =>
    translate("mobileKey.evidence.wrong_compartment.description", {
      scanned: compartmentPlace(scanned, translate),
      own: compartmentPlace(own, translate),
    });

  it("names the scanned Fach and the person's own", () => {
    expect(t("mobileKey.evidence.wrong_compartment.title")).toBe(
      "Anderes Fach",
    );
    expect(
      said(
        t,
        { number: 7, lockerBankName: "Y" },
        { number: 3, lockerBankName: "X" },
      ),
    ).toBe("Das ist Schrank Y, Fach 7. Ihr Fach: Schrank X, Fach 3.");
  });

  it("speaks the language of the page", () => {
    const english = translator("en");

    expect(english("mobileKey.evidence.wrong_compartment.title")).toBe(
      "Different compartment",
    );
    expect(
      said(
        english,
        { number: 7, lockerBankName: "Y" },
        { number: 3, lockerBankName: "X" },
      ),
    ).toBe(
      "This is cabinet Y, compartment 7. Your compartment: cabinet X, compartment 3.",
    );
  });
});
