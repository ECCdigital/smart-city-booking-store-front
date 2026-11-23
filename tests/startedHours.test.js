import { describe, expect, it } from "vitest";

import { countsStartedHours } from "~/utils/startedHours.js";
import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// An hour price can count every started hour in full. The details say so
// beside the prices, so bookers do not learn it from the total.

const hourly = (overrides = {}) => ({
  priceType: "per-hour",
  priceCountStartedHours: true,
  priceCategories: [{ priceEur: 10, fixedPrice: false }],
  ...overrides,
});

describe("countsStartedHours", () => {
  it("is true for an hour price counting started hours", () => {
    expect(countsStartedHours(hourly())).toBe(true);
  });

  it("is false by the minute, as a bookable stored without the flag is", () => {
    expect(countsStartedHours(hourly({ priceCountStartedHours: false }))).toBe(
      false,
    );
    const legacy = hourly();
    delete legacy.priceCountStartedHours;
    expect(countsStartedHours(legacy)).toBe(false);
  });

  it("is false for another price type", () => {
    expect(countsStartedHours(hourly({ priceType: "per-day" }))).toBe(false);
  });

  it("is false when every price is a Pauschalpreis or external", () => {
    expect(
      countsStartedHours(
        hourly({
          priceCategories: [
            { priceEur: 50, fixedPrice: true },
            { priceEur: 2, external: true, unit: "hour" },
          ],
        }),
      ),
    ).toBe(false);
  });

  it("is true when one hour Tarif sits beside a Pauschalpreis", () => {
    expect(
      countsStartedHours(
        hourly({
          priceCategories: [
            { priceEur: 50, fixedPrice: true },
            { priceEur: 10, fixedPrice: false },
          ],
        }),
      ),
    ).toBe(true);
  });

  it.each([
    ["de", de, "Jede angefangene Stunde wird voll berechnet."],
    ["en", en, "Every started hour is charged in full."],
  ])("is named in %s", (_, messages, hint) => {
    expect(messages.price.startedHoursHint).toBe(hint);
  });
});
