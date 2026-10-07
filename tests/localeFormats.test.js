import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { afterEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const ROOT = fileURLToPath(new URL("../", import.meta.url));

/** `useFormatting` as a component on a page in `code` gets it. */
function formattingIn(code) {
  // `useI18n` is a Nuxt auto-import; the composable reads it as a global.
  vi.stubGlobal("useI18n", () => ({ locale: ref(code) }));
  return useFormatting();
}

afterEach(() => {
  vi.unstubAllGlobals();
});

// Intl separates amount and sign with a no-break space.
const NBSP = " ";

describe("prices and dates follow the language of the page", () => {
  it("writes a price the English way on an English page", () => {
    expect(formattingIn("en").formatPrice(17.85)).toBe("€17.85");
    expect(formattingIn("de").formatPrice(17.85)).toBe(`17,85${NBSP}€`);
  });

  it("writes a day without its time in the order of the language", () => {
    const day = new Date(2026, 9, 20, 18, 0);

    expect(formattingIn("en").formatDay(day)).toBe("20/10/2026");
    expect(formattingIn("de").formatDay(day)).toBe("20.10.2026");
  });

  it("lets the caller shorten the year of a day", () => {
    const day = new Date(2026, 9, 20);

    expect(formattingIn("en").formatDay(day, { year: "2-digit" })).toBe(
      "20/10/26",
    );
    expect(formattingIn("de").formatDay(day, { year: "2-digit" })).toBe(
      "20.10.26",
    );
  });

  it("writes a plain number with the decimal mark of the language", () => {
    const twoPlaces = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

    expect(formattingIn("en").formatNumber(2.5, twoPlaces)).toBe("2.50");
    expect(formattingIn("de").formatNumber(2.5, twoPlaces)).toBe("2,50");
  });

  it("keeps the language a component started with when it formats later", () => {
    // A handler or a watcher runs outside setup, where `useI18n` throws.
    const formatting = formattingIn("en");
    vi.stubGlobal("useI18n", () => {
      throw new Error("Must be called at the top of a `setup` function");
    });

    expect(formatting.formatPrice(17.85)).toBe("€17.85");
  });
});

/** Every source file of the app a visitor sees, prototypes left out. */
function appSources(dir = join(ROOT, "app")) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return entry.name === "prototype" ? [] : appSources(path);
    }
    return /\.(vue|js|ts)$/.test(entry.name) ? [path] : [];
  });
}

const FORMATTING = join(ROOT, "app/composables/utils/useFormatting.js");

// The ways a component used to pin a format to German. "de-DE" as the German
// branch of a choice by language is fine; handed over on its own it is not.
const PINNED_GERMAN = [
  ["a fixed German locale", /[(=,]\s*["']de-DE["']/],
  [
    "a decimal point swapped for a comma",
    /replace\(\s*(["']\.["']|\/\\\.\/g?)\s*,\s*["'],["']\s*\)/,
  ],
  ["a euro sign glued on by hand", /["'] €["']|\}\}\s*€/],
];

describe("no component pins prices or dates to German", () => {
  const files = appSources().filter((file) => file !== FORMATTING);

  it.each(PINNED_GERMAN)("none uses %s", (_, pattern) => {
    const offenders = files
      .filter((file) => pattern.test(readFileSync(file, "utf8")))
      .map((file) => relative(ROOT, file));

    expect(offenders).toEqual([]);
  });
});

function translator(locale) {
  return createI18n({
    legacy: false,
    locale,
    messages: { de, en },
    missingWarn: false,
    fallbackWarn: false,
  }).global.t;
}

describe("texts of the result page", () => {
  it("counts one result in the singular and more in the plural", () => {
    const t = translator("de");

    expect(t("filter.fittingResults", 1)).toBe("1 passendes Ergebnis");
    expect(t("filter.fittingResults", 3)).toBe("3 passende Ergebnisse");
    expect(t("filter.fittingResults", 0)).toBe("0 passende Ergebnisse");
  });

  it("counts results in English as well", () => {
    const t = translator("en");

    expect(t("filter.fittingResults", 1)).toBe("1 matching result");
    expect(t("filter.fittingResults", 3)).toBe("3 matching results");
  });

  it("hands the count to the text instead of writing it in front", () => {
    const offenders = appSources()
      .filter((file) =>
        /fittingResults["']\s*\)/.test(readFileSync(file, "utf8")),
      )
      .map((file) => relative(ROOT, file));

    expect(offenders).toEqual([]);
  });

  it("spells the registration filter right", () => {
    expect(translator("de")("filter.onlyRegistrationNeeded")).toBe(
      "Nur anmeldepflichtige Events anzeigen.",
    );
  });
});

describe("the key list of Mobile Key", () => {
  const list = readFileSync(
    join(ROOT, "app/components/mobileKey/MobileKeyBookingList.vue"),
    "utf8",
  );

  it("labels the tenant in the language of the page", () => {
    expect(/Tenant:/.test(list)).toBe(false);
    expect(/\$t\("tenants\.tenant"\)/.test(list)).toBe(true);
    expect(translator("de")("tenants.tenant")).toBe("Mandant");
    expect(translator("en")("tenants.tenant")).toBe("Tenant");
  });
});
