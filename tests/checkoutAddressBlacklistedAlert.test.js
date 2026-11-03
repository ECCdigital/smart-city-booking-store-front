// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as Vue from "vue";
import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// The refusal of an address on the blacklist stays on the review step, and
// the instance's mail address in it can be written to or copied.
// A toast would be gone before either.
//
// Nuxt is not booted (see vitest.config.ts): the component's template is
// compiled and mounted with the state its script would provide.

const COMPONENT = "components/checkout/CheckoutAddressBlacklistedAlert.vue";
const OPERATOR = "betrieb@example.test";

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

// The alert renders its title and description; a button a plain <button>
// with what it was given.
const stubs = {
  UAlert: {
    props: ["title"],
    setup: (props, { slots }) => () =>
      Vue.h("div", { role: "alert" }, [
        Vue.h("strong", props.title),
        slots.description?.(),
      ]),
  },
  UButton: {
    inheritAttrs: false,
    setup: (_, { attrs }) => () => Vue.h("button", attrs),
  },
};

function mountAlert(locale, mailAddress, registration = false) {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  const state = {
    t: i18n.global.t,
    mailAddress,
    registration,
    copyMailAddress: vi.fn(),
  };
  const app = Vue.createApp({
    render: renderFunctionOf(COMPONENT),
    setup: () => state,
  });
  app.use(i18n);
  for (const [name, component] of Object.entries(stubs)) {
    app.component(name, component);
  }
  const missing = [];
  app.config.warnHandler = (message) => {
    if (message.includes("was accessed during render")) {
      missing.push(message);
    }
  };
  const root = document.createElement("div");
  app.mount(root);
  expect(missing).toEqual([]);
  return { state, root };
}

const textOf = (element) => element.textContent.replace(/\s+/g, " ").trim();
const title = (root) => textOf(root.querySelector("strong"));
const text = (root) => textOf(root.querySelector("p"));

describe("the refusal of an address on the blacklist", () => {
  it("links the instance's mail address to write to", () => {
    const { root } = mountAlert("de", OPERATOR);

    const link = root.querySelector("a");
    expect(link.getAttribute("href")).toBe(`mailto:${OPERATOR}`);
    expect(link.textContent.trim()).toBe(OPERATOR);
    expect(title(root)).toBe("Buchung nicht möglich");
    expect(text(root)).toBe(
      `Mit dieser Adresse ist keine Buchung möglich. Bei Fragen wende dich per Mail an ${OPERATOR}.`,
    );
  });

  it.each([
    ["de", "Mailadresse kopieren"],
    ["en", "Copy mail address"],
  ])("copies the mail address from a button of its own (%s)", (locale, label) => {
    const { state, root } = mountAlert(locale, OPERATOR);

    const copy = root.querySelector("button");
    expect(copy.getAttribute("aria-label")).toBe(label);
    copy.click();
    expect(state.copyMailAddress).toHaveBeenCalled();
  });

  it("names the operator of the offer, without link or button, where the instance has no mail address", () => {
    const { root } = mountAlert("de", "");

    expect(root.querySelector("a")).toBeNull();
    expect(root.querySelector("button")).toBeNull();
    expect(text(root)).toBe(
      "Mit dieser Adresse ist keine Buchung möglich. Bei Fragen wende dich per Mail an den Betreiber dieses Angebots.",
    );
  });

  it("speaks English too", () => {
    const { root } = mountAlert("en", OPERATOR);

    expect(title(root)).toBe("Booking not possible");
    expect(text(root)).toBe(
      `No booking is possible with this address. If you have questions, please write to ${OPERATOR}.`,
    );
  });
});

// The registration refuses an address on the blacklist with a title and a
// notice of its own.
describe("the refusal of a registration", () => {
  it("says that no registration is possible", () => {
    const { root } = mountAlert("de", OPERATOR, true);

    expect(title(root)).toBe("Registrierung nicht möglich");
    expect(text(root)).toBe(
      `Mit dieser E-Mail-Adresse ist keine Registrierung möglich. Bei Fragen wende dich per Mail an ${OPERATOR}.`,
    );
    expect(root.querySelector("a").getAttribute("href")).toBe(
      `mailto:${OPERATOR}`,
    );
  });

  it("names the operator without a mail address", () => {
    const { root } = mountAlert("de", "", true);

    expect(text(root)).toBe(
      "Mit dieser E-Mail-Adresse ist keine Registrierung möglich. Bei Fragen wende dich per Mail an den Betreiber dieses Angebots.",
    );
  });

  it("speaks English too", () => {
    const { root } = mountAlert("en", OPERATOR, true);

    expect(title(root)).toBe("Registration not possible");
    expect(text(root)).toBe(
      `No registration is possible with this email address. If you have questions, please write to ${OPERATOR}.`,
    );
  });
});
