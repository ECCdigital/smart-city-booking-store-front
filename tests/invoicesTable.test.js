// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as Vue from "vue";
import { compileTemplate, parse } from "vue/compiler-sfc";
import { describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// Each row of the table under Konto › Rechnungen opens its document from the
// title and downloads or prints it from a button (ECCdigital/tickets#458).
//
// Nuxt is not booted (see vitest.config.ts): the page's template is compiled
// and mounted with the state its script would provide.

const PAGE = "pages/account/invoices.vue";

function renderFunctionOf(path) {
  // Under jsdom, Vite rewrites `new URL(…, import.meta.url)` as an asset.
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

// The table renders the title and action cells of every row; a tooltip its
// trigger, a button a plain <button> with what it was given.
const stubs = {
  UTable: {
    props: ["data"],
    setup: (props, { slots }) => () =>
      Vue.h(
        "table",
        props.data.map((original) =>
          Vue.h("tr", [
            Vue.h("td", slots["title-cell"]?.({ row: { original } })),
            Vue.h("td", slots["actions-cell"]?.({ row: { original } })),
          ]),
        ),
      ),
  },
  UTooltip: { setup: (_, { slots }) => () => slots.default?.() },
  UButton: {
    inheritAttrs: false,
    setup: (_, { attrs }) => () => Vue.h("button", attrs),
  },
};

const attachment = {
  type: "invoice",
  name: "R-2026-0001.pdf",
  title: "R-2026-0001",
  timeCreated: Date.UTC(2026, 9, 1),
};

const row = {
  timeCreated: attachment.timeCreated,
  title: attachment.title,
  type: "invoice",
  typeLabel: "Rechnung",
  bookingId: "QDGJ-EESJ",
  tenantId: "rp43",
  attachment,
  bookableNames: "Saal",
  bookableLabel: "Saal",
  paidLabel: "Bezahlt",
  booking: {},
};

function mountPage(locale) {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  const state = {
    t: i18n.global.t,
    pending: false,
    paymentDocuments: [row],
    shownDocuments: [row],
    shownKey: "QDGJ-EESJ/R-2026-0001",
    pagedDocuments: [],
    searchQuery: "",
    sorting: [],
    pagination: { pageIndex: 0, pageSize: 25 },
    currentPage: 1,
    columns: [],
    sortableColumns: [],
    getPaginationRowModel: () => {},
    wrapTooltipUi: {},
    formatDate: () => "01.10.2026",
    tenantTo: (path) => path,
    sortIcon: () => "",
    openDocument: vi.fn(),
    downloadDocument: vi.fn(),
    printDocument: vi.fn(),
  };
  const app = Vue.createApp({
    render: renderFunctionOf(PAGE),
    setup: () => state,
  });
  app.use(i18n);
  for (const [name, component] of Object.entries(stubs)) {
    app.component(name, component);
  }
  // Unknown child components are expected; a name the template reads but the
  // state lacks means the state no longer matches the page.
  const missing = [];
  app.config.warnHandler = (message) => {
    if (message.includes("was accessed during render")) {
      missing.push(message);
    }
  };
  const root = document.createElement("div");
  app.mount(root);
  expect(missing).toEqual([]);
  const [title, download, print] = root.querySelectorAll("td button");
  return { state, title, download, print };
}

describe("a row of the invoices table", () => {
  it.each([
    ["de", "R-2026-0001 in neuem Tab öffnen"],
    ["en", "Open R-2026-0001 in a new tab"],
  ])("opens the document from its title (%s)", (locale, name) => {
    const { state, title } = mountPage(locale);

    expect(title.textContent.trim()).toBe("R-2026-0001");
    expect(title.getAttribute("aria-label")).toBe(name);
    title.click();
    expect(state.openDocument).toHaveBeenCalledWith(attachment, row);
  });

  it.each([
    ["de", "R-2026-0001 herunterladen"],
    ["en", "Download R-2026-0001"],
  ])("downloads the document (%s)", (locale, name) => {
    const { state, download } = mountPage(locale);

    expect(download.getAttribute("aria-label")).toBe(name);
    download.click();
    expect(state.downloadDocument).toHaveBeenCalledWith(attachment, row);
  });

  it.each([
    ["de", "R-2026-0001 drucken"],
    ["en", "Print R-2026-0001"],
  ])("prints the document (%s)", (locale, name) => {
    const { state, print } = mountPage(locale);

    expect(print.getAttribute("aria-label")).toBe(name);
    print.click();
    expect(state.printDocument).toHaveBeenCalledWith(attachment, row);
  });
});

describe("a card of the invoices list on narrow screens", () => {
  const CARD = "components/user/invoices/PaymentDocumentCard.vue";

  function mountCard(locale) {
    const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
    const emit = vi.fn();
    const app = Vue.createApp({
      render: renderFunctionOf(CARD),
      setup: () => ({
        paymentDocument: row,
        t: i18n.global.t,
        formatDate: () => "01.10.2026",
        bookingTo: "/account/bookings/QDGJ-EESJ",
        emit,
      }),
    });
    app.use(i18n);
    app.component("UButton", {
      inheritAttrs: false,
      props: ["label"],
      setup: (props, { attrs }) => () => Vue.h("button", attrs, props.label),
    });
    const root = document.createElement("div");
    app.mount(root);
    const [title, download, print] = root.querySelectorAll("button");
    return { root, emit, title, download, print };
  }

  it("shows what a row of the table shows", () => {
    const { root } = mountCard("de");

    const text = root.textContent;
    expect(text).toContain("Rechnung");
    expect(text).toContain("01.10.2026");
    expect(text).toContain("R-2026-0001");
    expect(text).toContain("Saal");
    expect(text).toContain("#QDGJ-EESJ");
  });

  it.each([
    ["de", "R-2026-0001 in neuem Tab öffnen", "Herunterladen", "Drucken"],
    ["en", "Open R-2026-0001 in a new tab", "Download", "Print"],
  ])("names its actions (%s)", (locale, open, download, print) => {
    const card = mountCard(locale);

    expect(card.title.getAttribute("aria-label")).toBe(open);
    expect(card.download.textContent).toBe(download);
    expect(card.print.textContent).toBe(print);
  });

  it.each([
    ["title", "open"],
    ["download", "download"],
    ["print", "print"],
  ])("asks the page to %s the document", (button, event) => {
    const card = mountCard("de");

    card[button].click();
    expect(card.emit).toHaveBeenCalledWith(event);
  });
});
