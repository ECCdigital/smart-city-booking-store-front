// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { join } from "node:path";

import * as Vue from "vue";
import { compileScript, parse } from "vue/compiler-sfc";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createI18n } from "vue-i18n";

import * as offer from "~/composables/search/offer";
import * as catalogFilters from "~/composables/search/catalogFilters";
import * as nearbyOffers from "~/utils/nearbyOffers.js";
import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";

// „Mein Standort“ on the start page (ECCdigital/tickets#1366): where the
// browser refuses the position, the map says so under it rather than staying
// silent, and the button is not pressed.
//
// Nuxt is not booted (see vitest.config.ts): the component is compiled with
// its script, its imports come from the map below and Nuxt's auto-imports
// are handed in, so the click runs the component's own code.

const COMPONENT = "components/home/NearbyMapArea.vue";

// Kiel and Hamburg, both with a location.
const BOOKABLES = [
  { id: "kiel", name: "Kiel", location: { coordinates: { points: [10.1228, 54.3233] } } },
  { id: "hamburg", name: "Hamburg", location: { coordinates: { points: [9.9937, 53.5511] } } },
];

const modules = {
  vue: Vue,
  "~/components/search/ResultsMap.vue": {
    default: {
      props: ["bookables"],
      setup: (props) => () =>
        Vue.h("div", { "data-map": props.bookables.length }),
    },
  },
  "~/composables/search/offer": offer,
  "~/composables/search/catalogFilters": catalogFilters,
  "~/utils/nearbyOffers.js": nearbyOffers,
  "~/composables/api/useCatalog.js": {
    useCatalog: () => ({
      fetchCatalogBundle: async () => ({ bookables: BOOKABLES }),
    }),
  },
  "~~/stores/catalog.js": { useCatalogStore: () => ({ catalog: null }) },
  "~~/stores/tenant.js": { useTenantStore: () => ({ tenants: [] }) },
  // The section comes into view at once.
  "@vueuse/core": {
    useIntersectionObserver: (_target, callback) => {
      Promise.resolve().then(() => callback([{ isIntersecting: true }]));
      return { stop: () => {} };
    },
  },
};

const autoImports = {
  ref: Vue.ref,
  computed: Vue.computed,
  onMounted: Vue.onMounted,
  useTenantRoute: () => ({ tenantTo: (to) => to }),
  useRoute: () => ({ params: {} }),
  useTenant: () => ({ tenantID: Vue.ref(null) }),
};

/** The component as an object, its imports taken from `modules`. */
function componentOf(path) {
  const file = join(import.meta.dirname, "../app", path);
  const { descriptor } = parse(readFileSync(file, "utf8"), { filename: file });
  const { content } = compileScript(descriptor, { id: path, inlineTemplate: true });
  const code = content
    .replace(
      /^import\s+\{([^}]*)\}\s+from\s+"([^"]+)";?$/gm,
      (_, names, from) =>
        `const {${names.replace(/\s+as\s+/g, ": ")}} = modules[${JSON.stringify(from)}];`,
    )
    .replace(
      /^import\s+(\w+)\s+from\s+"([^"]+)";?$/gm,
      (_, name, from) => `const ${name} = modules[${JSON.stringify(from)}].default;`,
    )
    .replace(/^export default\s*/m, "return ");
  const names = Object.keys(autoImports);
  return new Function("modules", ...names, code)(
    modules,
    ...names.map((name) => autoImports[name]),
  );
}

const stubs = {
  UButton: {
    inheritAttrs: false,
    props: ["label", "loading", "icon"],
    setup: (props, { attrs }) => () => Vue.h("button", attrs, props.label),
  },
  USkeleton: { setup: () => () => Vue.h("div") },
};

/** Answers every request for the position as a permissions policy does. */
function refusePosition() {
  const getCurrentPosition = vi.fn((_success, error) =>
    error({
      code: 1,
      PERMISSION_DENIED: 1,
      message: "Geolocation has been disabled in this document by permissions policy.",
    }),
  );
  vi.stubGlobal("navigator", {
    ...globalThis.navigator,
    geolocation: { getCurrentPosition },
  });
  return getCurrentPosition;
}

async function mountArea(locale) {
  const i18n = createI18n({ legacy: false, locale, messages: { de, en } });
  const app = Vue.createApp(componentOf(COMPONENT));
  app.use(i18n);
  for (const [name, component] of Object.entries(stubs)) {
    app.component(name, component);
  }
  const root = document.createElement("div");
  app.mount(root);
  // The section comes into view, then its Offers arrive.
  await new Promise((resolve) => setTimeout(resolve));
  await Vue.nextTick();
  return root;
}

const textOf = (element) => element.textContent.replace(/\s+/g, " ").trim();
/** The button „Mein Standort“, found by its label. */
const locationButton = (root, label) =>
  [...root.querySelectorAll("button")].find(
    (button) => textOf(button) === label,
  );
const hint = (root) => textOf(root.querySelector("p.mt-3"));

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("„Mein Standort“ where the browser refuses the position", () => {
  it("says under the map that the position is not available", async () => {
    const getCurrentPosition = refusePosition();
    const root = await mountArea("de");
    expect(textOf(root.querySelector("h2 + p"))).toBe("2 Angebote mit Standort");
    expect(hint(root)).not.toContain("Ihr Standort ist nicht verfügbar");

    locationButton(root, "Mein Standort").click();
    await Vue.nextTick();

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(hint(root)).toContain(
      "Ihr Standort ist nicht verfügbar, die Karte zeigt alle Angebote.",
    );
    expect(locationButton(root, "Mein Standort").getAttribute("aria-pressed")).toBe("false");
    expect(textOf(root.querySelector("h2 + p"))).toBe("2 Angebote mit Standort");
    expect(root.querySelector("[data-map]").dataset.map).toBe("2");
  });

  it("speaks English too", async () => {
    refusePosition();
    const root = await mountArea("en");

    locationButton(root, "My location").click();
    await Vue.nextTick();

    expect(hint(root)).toContain(
      "Your location is not available, so the map shows all offers.",
    );
  });
});
