import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";
import {
  refundPercentOf,
  wordTimeBeforeStart,
} from "~/utils/cancellationRefundTiers.js";

const tOf = (locale) => createI18n({ locale, messages: { de, en } }).global.t;

/**
 * The unpaid hint of the cancellation dialog names the time the backend
 * sends (`timeBeforeStart`) with its own keys: the tier keys read „bis …
 * vor Beginn“ and would double it.
 */
function unpaidHint(locale, time) {
  const t = tOf(locale);
  return t("booking.cancellation.unpaidFeeDue", {
    time: wordTimeBeforeStart(time, t),
    percent: 25,
    fee: "30,00 €",
  });
}

describe("wordTimeBeforeStart", () => {
  it("words the days and hours the backend sends, no rule of its own", () => {
    const t = tOf("de");
    expect(wordTimeBeforeStart({ days: 0, hours: 13 }, t)).toBe("13 Stunden");
    expect(wordTimeBeforeStart({ days: 1, hours: 22 }, t)).toBe(
      "1 Tag und 22 Stunden",
    );
    expect(wordTimeBeforeStart({ days: 10, hours: 0 }, t)).toBe("10 Tage");
  });

  it("answers null where the preview names no time", () => {
    const t = tOf("de");
    expect(wordTimeBeforeStart(null, t)).toBeNull();
    expect(wordTimeBeforeStart(undefined, t)).toBeNull();
    expect(wordTimeBeforeStart({ days: null, hours: null }, t)).toBeNull();
  });
});

describe("the time in the unpaid hint", () => {
  it("reads once „vor Buchungsbeginn“, without the tier's „bis … vor Beginn“", () => {
    expect(unpaidHint("de", { days: 1, hours: 22 })).toBe(
      "Diese Buchung wurde noch nicht bezahlt. Da Sie 1 Tag und 22 Stunden vor Buchungsbeginn stornieren, entfallen 25 % des Betrags. Ein Betrag von 30,00 € bleibt zu zahlen.",
    );
  });

  it("does the same in English", () => {
    expect(unpaidHint("en", { days: 2, hours: 1 })).toBe(
      "This booking has not been paid yet. As you cancel 2 days and 1 hour before the start of the booking, 25 % of the amount drops. An amount of 30,00 € remains to be paid.",
    );
  });

  it("says the hint without the time where none is known", () => {
    expect(tOf("de")("booking.cancellation.unpaidBookingNoTime")).toBe(
      "Diese Buchung wurde noch nicht bezahlt. Der gesamte Betrag entfällt. Es fallen für Sie somit keine Kosten an.",
    );
  });
});

describe("refundPercentOf", () => {
  it("takes the applied share, else the suggested, else 0, as the backend does", () => {
    expect(
      refundPercentOf({
        appliedRefundPercentage: 25,
        suggestedRefundPercentage: 50,
      }),
    ).toBe(25);
    expect(
      refundPercentOf({
        appliedRefundPercentage: null,
        suggestedRefundPercentage: 50,
      }),
    ).toBe(50);
    expect(refundPercentOf({})).toBe(0);
  });
});
