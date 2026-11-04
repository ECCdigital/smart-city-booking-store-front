import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

function tOf(locale) {
  return createI18n({ legacy: false, locale, messages: { de, en } }).global.t;
}

describe("the cancellation dialog names a refund tier „bis x vor Beginn“", () => {
  it.each([
    ["de", "tierDays", 2, "bis 2 Tage vor Beginn"],
    ["de", "tierDays", 1, "bis 1 Tag vor Beginn"],
    ["de", "tierHours", 36, "bis 36 Stunden vor Beginn"],
    ["de", "tierHours", 1, "bis 1 Stunde vor Beginn"],
    ["en", "tierDays", 2, "up to 2 days before the start"],
    ["en", "tierHours", 1, "up to 1 hour before the start"],
  ])("%s %s %i: „%s“", (locale, key, n, text) => {
    expect(tOf(locale)(`booking.cancellation.${key}`, { n }, n)).toBe(text);
  });

  it("reads „bis zum Beginn“ at 0 hours", () => {
    expect(tOf("de")("booking.cancellation.tierAtStart")).toBe(
      "bis zum Beginn",
    );
  });

  it("puts the tier into the hint as the detail page names it", () => {
    const t = tOf("de");
    const hint = t("booking.cancellation.tierHint", {
      tier: t("booking.cancellation.tierDays", { n: 2 }, 2),
      tenant: "Stadt",
      percent: 50,
      feePercent: 50,
    });

    expect(hint).toContain(
      "Es gilt die Erstattungsstufe „bis 2 Tage vor Beginn“: Stadt erstattet 50 %",
    );
    expect(t("bookableDetail.untilDaysBefore", { n: 2 }, 2)).toBe(
      "Bis 2 Tage vor Beginn",
    );
  });
});
