import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** Every key below `messages`, as dotted paths. */
function keysOf(messages, prefix = "") {
  return Object.entries(messages).flatMap(([key, value]) =>
    value && typeof value === "object"
      ? keysOf(value, `${prefix}${key}.`)
      : [`${prefix}${key}`],
  );
}

function translator(locale) {
  return createI18n({
    legacy: false,
    locale,
    messages: { de, en },
    missingWarn: false,
    fallbackWarn: false,
  }).global.t;
}

function source(path) {
  return readFileSync(join(ROOT, path), "utf8");
}

describe("Mobile Key in English", () => {
  it("has every text in English that it has in German", () => {
    const english = new Set(keysOf(en.mobileKey));
    const missing = keysOf(de.mobileKey).filter((key) => !english.has(key));

    expect(missing).toEqual([]);
  });

  it("has no English text without a German one", () => {
    const german = new Set(keysOf(de.mobileKey));
    const extra = keysOf(en.mobileKey).filter((key) => !german.has(key));

    expect(extra).toEqual([]);
  });

  it("says „Status unbekannt“ in English", () => {
    expect(translator("en")("mobileKey.errors.status_unavailable.title")).toBe(
      "Status unknown",
    );
  });
});

describe("the key list of Mobile Key", () => {
  const list = source("app/components/mobileKey/MobileKeyBookingList.vue");

  it("names a booking without a bookable in the language of the page", () => {
    expect(list).not.toMatch(/Unbekanntes Buchungsobjekt/);
    expect(translator("en")("booking.unknownBookable")).toBe(
      "Unknown bookable",
    );
  });

  it("says that an address is missing in the language of the page", () => {
    expect(list).not.toMatch(/Keine Adresse angegeben/);
    expect(translator("de")("mobileKey.noAddress")).toBe(
      "Keine Adresse angegeben",
    );
    expect(translator("en")("mobileKey.noAddress")).toBe("No address given");
  });

  it("counts doors in the singular and the plural", () => {
    expect(list).not.toMatch(/"Türen?"/);

    const german = translator("de");
    const english = translator("en");
    expect(german("mobileKey.doorCount", 1)).toBe("1 Tür");
    expect(german("mobileKey.doorCount", 2)).toBe("2 Türen");
    expect(english("mobileKey.doorCount", 1)).toBe("1 door");
    expect(english("mobileKey.doorCount", 2)).toBe("2 doors");
  });
});

describe("a booking named by its number", () => {
  it.each([
    "app/components/mobileKey/AccessPointCard.vue",
    "app/pages/mobile-key/[tenant]/[scanCode].vue",
  ])("is named in the language of the page in %s", (path) => {
    expect(source(path)).not.toMatch(/Buchung #/);
  });

  it("reads „Booking #…“ in English", () => {
    expect(translator("de")("mobileKey.bookingNumber", { id: 4711 })).toBe(
      "Buchung #4711",
    );
    expect(translator("en")("mobileKey.bookingNumber", { id: 4711 })).toBe(
      "Booking #4711",
    );
  });
});

describe("the Control Button", () => {
  it("asks for the tap in the language of the page", () => {
    const button = source(
      "app/components/mobileKey/AccessPointControlButton.vue",
    );

    expect(button).not.toMatch(/Tippen Sie/);
    expect(
      translator("en")("mobileKey.stages.can_open.title", { label: "Gate" }),
    ).toBe("Tap to open Gate");
    expect(
      translator("en")("mobileKey.stages.can_close.description", {
        label: "Gate",
      }),
    ).toBe("Tap to lock Gate");
  });
});
