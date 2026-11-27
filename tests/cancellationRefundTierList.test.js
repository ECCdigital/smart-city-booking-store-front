// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as Vue from "vue";
import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";
import {
  formatTierDeadline,
  sortedRefundTiers,
} from "~/utils/cancellationRefundTiers.js";

// The refund scale shows the same on the detail page, in the checkout's price
// card and in its summary: a hint, then one list entry per tier, the longest
// deadline first, deadline and refund in the same entry.
//
// Nuxt is not booted (see vitest.config.ts): the component's template is
// compiled and mounted with the state its script would provide.

const COMPONENT = "components/CancellationRefundTierList.vue";

const TIERS = [
  { hoursBeforeStart: 0, refundPercentage: 0 },
  { hoursBeforeStart: 168, refundPercentage: 100 },
  { hoursBeforeStart: 36, refundPercentage: 50 },
];

function tOf(locale) {
  return createI18n({ legacy: false, locale, messages: { de, en } }).global.t;
}

function renderFunctionOf(path) {
  const file = join(import.meta.dirname, "../app", path);
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  const { code } = compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id: path,
    compilerOptions: { mode: "function" },
  });
  return new Function("Vue", code)(Vue);
}

function mountList(locale, tiers) {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  const state = {
    rowClass: "",
    compact: false,
    sortedTiers: sortedRefundTiers(tiers),
    formatTierDeadline,
  };
  const app = Vue.createApp({
    render: renderFunctionOf(COMPONENT),
    setup: () => state,
  });
  app.use(i18n);
  const missing = [];
  app.config.warnHandler = (message) => {
    if (message.includes("was accessed during render")) {
      missing.push(message);
    }
  };
  const root = document.createElement("div");
  app.mount(root);
  expect(missing).toEqual([]);
  return root;
}

const textOf = (element) => element.textContent.replace(/\s+/g, " ").trim();

describe("formatTierDeadline", () => {
  it.each([
    ["de", 0, "Bis zum Beginn"],
    ["de", 24, "Bis 1 Tag vor Beginn"],
    ["de", 168, "Bis 7 Tage vor Beginn"],
    ["de", 1, "Bis 1 Stunde vor Beginn"],
    ["de", 36, "Bis 36 Stunden vor Beginn"],
    ["en", 0, "Up to the start"],
    ["en", 48, "Up to 2 days before the start"],
    ["en", 36, "Up to 36 hours before the start"],
  ])("%s %i hours: „%s“", (locale, hours, text) => {
    expect(formatTierDeadline(tOf(locale), hours)).toBe(text);
  });
});

describe("the refund scale", () => {
  it("lists the tiers, the longest deadline first, each with its refund", () => {
    const root = mountList("de", TIERS);

    const entries = [...root.querySelectorAll("ul > li")].map(textOf);
    expect(entries).toEqual([
      "Bis 7 Tage vor Beginn: 100 % Rückerstattung",
      "Bis 36 Stunden vor Beginn: 50 % Rückerstattung",
      "Bis zum Beginn: 0 % Rückerstattung",
    ]);
    expect(textOf(root.querySelector("p"))).toBe(
      "Je früher storniert wird, desto höher ist die Rückerstattung.",
    );
  });

  it("speaks English too", () => {
    const root = mountList("en", TIERS);

    expect(textOf(root.querySelector("ul > li"))).toBe(
      "Up to 7 days before the start: 100 % refund",
    );
  });

  it("shows nothing without tiers", () => {
    const root = mountList("de", []);

    expect(root.querySelector("ul")).toBeNull();
    expect(textOf(root)).toBe("");
  });
});
