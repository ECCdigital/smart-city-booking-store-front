import { describe, expect, it } from "vitest";

import { isIsoDateBefore } from "~/utils/localDate.js";
import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// Wednesday, 07.10.2026, noon local time.
const NOW = new Date(2026, 9, 7, 12, 0, 0);

/**
 * The checkout takes no typed date before today (ECCdigital/tickets#188):
 * the calendar had a minimum, the typed date field had none.
 */
describe("isIsoDateBefore", () => {
  it("is true for a typed date before today", () => {
    expect(isIsoDateBefore("2024-06-14", NOW)).toBe(true);
    expect(isIsoDateBefore("2026-10-06", NOW)).toBe(true);
  });

  it("is false for today and later", () => {
    expect(isIsoDateBefore("2026-10-07", NOW)).toBe(false);
    expect(isIsoDateBefore("2027-01-01", NOW)).toBe(false);
  });

  it("is false without a date or without a minimum", () => {
    expect(isIsoDateBefore("", NOW)).toBe(false);
    expect(isIsoDateBefore("2024-06-14", null)).toBe(false);
  });
});

describe("the texts of a date before today", () => {
  it("names the refused typed date in German and English", () => {
    expect(de.timePeriods.dateBeforeToday).toBe(
      "Das Datum darf nicht vor heute liegen.",
    );
    expect(en.timePeriods.dateBeforeToday).toBe(
      "The date cannot be before today.",
    );
  });

  it("names the backend's reason checkout.time_in_past in German and English", () => {
    expect(de.checkout.time_in_past).toBe(
      "Der gewählte Beginn liegt in der Vergangenheit. Bitte wählen Sie einen Zeitpunkt ab jetzt.",
    );
    expect(en.checkout.time_in_past).toBe(
      "The chosen start lies in the past. Please choose a time from now on.",
    );
  });
});
