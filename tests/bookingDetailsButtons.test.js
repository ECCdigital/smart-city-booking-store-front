import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import * as Vue from "vue";
import { compileTemplate, parse } from "vue/compiler-sfc";
import { renderToString } from "vue/server-renderer";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// The icon-only buttons of the booking details carry a tooltip, which a
// screen reader does not read as the button's name (ECCdigital/tickets#271).
// Each one needs an `aria-label` in the language of the page.
//
// Nuxt is not booted (see vitest.config.ts): only a component's template is
// compiled and rendered, with i18n and the state its script would provide.

/** The template of a component under `app/`, compiled to a render function. */
function renderFunctionOf(path) {
  const file = fileURLToPath(new URL(`../app/${path}`, import.meta.url));
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  const { code } = compileTemplate({
    source: descriptor.template.content,
    filename: file,
    id: path,
    compilerOptions: { mode: "function" },
  });
  return new Function("Vue", code)(Vue);
}

// Nuxt UI and the child components are not under test: a tooltip renders its
// trigger, a button a plain <button> with what it was given,
// the rest stays an unknown element.
const stubs = {
  UTooltip: { setup: (_, { slots }) => () => slots.default?.() },
  UButton: {
    inheritAttrs: false,
    setup: (_, { attrs }) => () => Vue.h("button", attrs),
  },
};

/** The buttons of a component's template, rendered in `locale`. */
async function buttonsOf(path, locale, state) {
  const app = Vue.createSSRApp({
    render: renderFunctionOf(path),
    setup: () => state,
  });
  app.use(createI18n({ legacy: false, locale, messages: { de, en } }));
  for (const [name, component] of Object.entries(stubs)) {
    app.component(name, component);
  }
  // Unknown child components are expected; a name the template reads but the
  // state lacks means the state no longer matches the component.
  const missing = [];
  app.config.warnHandler = (message) => {
    if (message.includes("was accessed during render")) {
      missing.push(message);
    }
  };
  const html = await renderToString(app, {});
  expect(missing).toEqual([]);
  const { document } = new JSDOM(html).window;
  return [...document.querySelectorAll("button")];
}

const booking = {
  id: "QDGJ-EESJ",
  tenantId: "rp43",
  timeCreated: Date.UTC(2026, 9, 1),
  timeBegin: Date.UTC(2026, 9, 20, 16),
  timeEnd: Date.UTC(2026, 9, 20, 18),
  bookableItems: [],
  attachments: [],
};

function detailsSectionState() {
  return {
    booking,
    formatDate: () => "20.10.2026",
    getBookingTenant: () => ({ name: "RP43" }),
    isLive: true,
    bookingTimeSlot: ["20.10.2026 18:00", "20.10.2026 20:00"],
    eventIds: [],
    events: [],
    bookingEvent: null,
    bookingEventTimeSlot: null,
    bookingPrice: "0,00 €",
    paymentMethod: "–",
    isFree: true,
    paymentDocuments: [],
    otherDocuments: [],
    accessPoints: [],
    downloadAppointment: () => {},
  };
}

function bookableCardState() {
  return {
    bookable: {
      bookableId: "room-1",
      amount: 1,
      _bookableUsed: { title: "Saal", location: {} },
    },
    bookableTitle: "Saal",
    eventId: null,
    bookingPrice: "0,00 €",
    goToBookable: () => {},
  };
}

function invoiceCardState(locale) {
  const messages = { de, en }[locale];
  return {
    attachment: {
      type: "invoice",
      name: "R-2026-0001.pdf",
      title: "R-2026-0001",
      timeCreated: Date.UTC(2026, 9, 1),
    },
    isPaymentDocument: true,
    attachmentType: messages.booking.attachmentTypes.invoice,
    formatDate: () => "01.10.2026",
    downloadAttachment: () => {},
  };
}

describe("buttons in the booking details have an accessible name", () => {
  it.each([
    ["de", "Termin herunterladen"],
    ["en", "Download appointment"],
  ])("names the calendar file button (%s)", async (locale, name) => {
    const [button] = await buttonsOf(
      "components/user/BookingDetailsSection.vue",
      locale,
      detailsSectionState(),
    );

    expect(button.getAttribute("aria-label")).toBe(name);
  });

  it.each([
    ["de", "Zum Buchungsobjekt gehen"],
    ["en", "Go to the bookable item"],
  ])("names the button that opens the booked bookable (%s)", async (locale, name) => {
    const [button] = await buttonsOf(
      "components/user/bookings/BookingDetailsBookableCard.vue",
      locale,
      bookableCardState(),
    );

    expect(button.getAttribute("aria-label")).toBe(name);
  });

  it.each([
    ["de", "Rechnung herunterladen"],
    ["en", "Download Invoice"],
  ])("names the invoice download button (%s)", async (locale, name) => {
    const [button] = await buttonsOf(
      "components/user/bookings/BookingDetailsAttachmentCard.vue",
      locale,
      invoiceCardState(locale),
    );

    expect(button.getAttribute("aria-label")).toBe(name);
  });
});
