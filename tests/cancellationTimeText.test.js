import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";
import { timeBeforeStart } from "~/utils/cancellationRefundTiers.js";

/**
 * The unpaid hint of the cancellation dialog names the time before the start
 * with its own keys: the tier keys read „bis … vor Beginn“ and would double it.
 */
function unpaidHint(locale, days, hours) {
  const { t } = createI18n({ locale, messages: { de, en } }).global;
  const time = t("booking.cancellation.timeDaysAndHours", {
    days: t("booking.cancellation.timeDays", { n: days }, days),
    hours: t("booking.cancellation.timeHours", { n: hours }, hours),
  });
  return t("booking.cancellation.unpaidFeeDue", {
    time,
    percent: 25,
    fee: "30,00 €",
  });
}

describe("the time in the unpaid hint", () => {
  it("reads once „vor Buchungsbeginn“, without the tier's „bis … vor Beginn“", () => {
    expect(unpaidHint("de", 1, 22)).toBe(
      "Diese Buchung wurde noch nicht bezahlt. Da Sie 1 Tag und 22 Stunden vor Buchungsbeginn stornieren, bekommen Sie 25 % erstattet. Ein Betrag von 30,00 € bleibt zu zahlen.",
    );
  });

  it("does the same in English", () => {
    expect(unpaidHint("en", 2, 1)).toBe(
      "This booking has not been paid yet. As you cancel 2 days and 1 hour before the start of the booking, 25 % is refunded to you. An amount of 30,00 € remains to be paid.",
    );
  });
});

describe("an unpaid booking without a start to count from", () => {
  it("takes the backend's null as no time, not as 0 hours", () => {
    expect(timeBeforeStart(null)).toBeNull();
  });

  it("says the hint without the time", () => {
    const { t } = createI18n({ locale: "de", messages: { de, en } }).global;
    expect(
      t("booking.cancellation.unpaidBookingNoTime", { percent: 100 }),
    ).toBe(
      "Diese Buchung wurde noch nicht bezahlt. Sie bekommen 100 % erstattet. Es fallen für Sie somit keine Kosten an.",
    );
  });
});
