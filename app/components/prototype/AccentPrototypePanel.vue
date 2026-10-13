<template>
  <!--
    PROTOTYPE #512 (Karte #510): Welche Elemente trägt die Akzentfarbe, und
    braucht sie einen eigenen Wert für den Dunkelmodus? Drei Varianten,
    umschaltbar per ?variant=A|B|C. Der Zustand steht in der URL und wandert
    bei jeder Navigation mit. Nur im Dev-Modus, nie in main.
  -->
  <div v-if="isDev">
    <PrototypeVariantSwitcher :variants="VARIANTS" :names="NAMES" />
    <div
      class="fixed top-20 right-3 z-[100] w-72 rounded-xl bg-neutral-900 text-white text-xs font-mono shadow-2xl border border-yellow-400"
    >
      <button
        class="w-full flex justify-between items-center px-3 py-2"
        @click="open = !open"
      >
        <span><span class="text-yellow-300">PROTOTYPE #512</span> · {{ variant }} {{ NAMES[variant] }}</span>
        <span>{{ open ? "–" : "+" }}</span>
      </button>
      <div v-if="open" class="px-3 pb-3 space-y-3">
        <p class="text-neutral-300 leading-snug">{{ DESCRIPTIONS[variant] }}</p>

        <label class="flex items-center gap-2">
          <input type="checkbox" :checked="!off" @change="set({ off: $event.target.checked ? undefined : '1' })">
          Akzentfarbe gesetzt (aus = heute)
        </label>

        <div class="space-y-1">
          <div class="text-neutral-400">Dunkelmodus</div>
          <label v-for="(label, key) in DARK_MODES" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-dark" :checked="darkMode === key" @change="set({ dark: key })">
            {{ label }}
          </label>
        </div>

        <div class="flex items-center gap-2">
          <input type="color" :value="accentLight" @change="set({ accent: $event.target.value.slice(1) })">
          <span>Akzent hell {{ accentLight }}</span>
        </div>
        <div v-if="darkMode === 'eigen'" class="flex items-center gap-2">
          <input type="color" :value="accentDark" @change="set({ accentDark: $event.target.value.slice(1) })">
          <span>Akzent dunkel {{ accentDark }}</span>
        </div>
        <div v-else class="flex items-center gap-2 text-neutral-400">
          <span class="inline-block w-6 h-6 rounded border border-white/30" :style="{ background: accentDark }" />
          <span>Akzent dunkel {{ accentDark }}</span>
        </div>

        <div class="flex flex-wrap gap-1">
          <button
            v-for="c in PRESETS"
            :key="c"
            class="w-5 h-5 rounded border border-white/30"
            :style="{ background: c }"
            :title="c"
            @click="set({ accent: c.slice(1), accentDark: undefined })"
          />
        </div>

        <label v-if="variant !== 'B'" class="flex items-center gap-2">
          <input type="checkbox" :checked="hero" @change="set({ hero: $event.target.checked ? '1' : undefined })">
          Hero: Text in „Primär“ als „Akzent“ zeigen
        </label>

        <table class="w-full text-[11px]"><tbody>
          <tr class="text-neutral-400"><td>Kontrast</td><td>hell</td><td>dunkel</td></tr>
          <tr>
            <td>Akzent als Text</td>
            <td :class="grade(contrast(accentLight, '#ffffff'))">{{ contrast(accentLight, "#ffffff").toFixed(1) }}</td>
            <td :class="grade(contrast(accentDark, '#111827'))">{{ contrast(accentDark, "#111827").toFixed(1) }}</td>
          </tr>
          <tr>
            <td>Schrift auf Akzent</td>
            <td :class="grade(contrast(accentLight, onColor(accentLight)))">{{ contrast(accentLight, onColor(accentLight)).toFixed(1) }}</td>
            <td :class="grade(contrast(accentDark, onColor(accentDark)))">{{ contrast(accentDark, onColor(accentDark)).toFixed(1) }}</td>
          </tr>
        </tbody></table>
        <p class="text-neutral-500 leading-snug">AA für Text: 4.5. Hintergrund hell weiß, dunkel gray-900.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const isDev = import.meta.dev;
const route = useRoute();
const router = useRouter();

const VARIANTS = ["A", "B", "C"];
const NAMES = { A: "Hervorhebung", B: "Zustand", C: "Dekor" };
const DESCRIPTIONS = {
  A: "Akzent hebt Inhalte hervor: Badges, Textlinks (Rich Text, Footer, Login), Fokusring, Polygone und ein Leuchtkreis im Hintergrund, Hero-Text. Primär bleibt bei Knöpfen, Header und Preisen. Sekundär bleibt bei Auswahl und aktiven Zuständen.",
  B: "Akzent übernimmt alle Zustände: ausgewählt, aktiv, Fokus, Häkchen, Schalter, aktiver Header-Tab, Fortschritt im Checkout. Das ist heute Sekundär. Sekundär wandert auf Badges, Streifen und Hintergrund.",
  C: "Akzent nur als Dekor ohne Text: Streifen an den Ergebniskarten, Kreis der Kategorie-Icons und Hover-Rahmen, Polygone und ein Leuchtkreis im Hintergrund, Hero-Text. Kein Link, kein Zustand.",
};
const DARK_MODES = {
  ein: "Ein Wert für beide Modi",
  eigen: "Eigener Wert für dunkel",
  auto: "Dunkel abgeleitet (30 % aufgehellt)",
};
const PROTO_KEYS = ["variant", "accent", "accentDark", "dark", "off", "hero"];
const PRESETS = ["#f59e0b", "#e11d48", "#0d9488", "#2563eb", "#65a30d", "#1e293b"];

const open = ref(true);
const variant = computed(() => (VARIANTS.includes(route.query.variant) ? route.query.variant : "A"));
const off = computed(() => route.query.off === "1");
const hero = computed(() => route.query.hero === "1");
const darkMode = computed(() => (DARK_MODES[route.query.dark] ? route.query.dark : "ein"));
const accentLight = computed(() => hex(route.query.accent) ?? "#f59e0b");
const accentDark = computed(() => {
  if (darkMode.value === "eigen") return hex(route.query.accentDark) ?? mix(accentLight.value, "#ffffff", 0.3);
  if (darkMode.value === "auto") return mix(accentLight.value, "#ffffff", 0.3);
  return accentLight.value;
});

function hex(v) {
  return typeof v === "string" && /^[0-9a-fA-F]{6}$/.test(v) ? `#${v.toLowerCase()}` : null;
}

function set(patch) {
  const query = { ...route.query, ...patch };
  for (const k of Object.keys(query)) if (query[k] === undefined) delete query[k];
  router.replace({ query });
}

// Der Zustand wandert bei jeder Navigation mit, damit Startseite, Detail,
// Checkout und Konto dieselbe Variante zeigen.
let removeGuard;
onMounted(() => {
  removeGuard = router.beforeEach((to, from) => {
    const carry = {};
    for (const k of PROTO_KEYS) if (from.query[k] !== undefined && to.query[k] === undefined) carry[k] = from.query[k];
    if (Object.keys(carry).length && to.path !== from.path) return { ...to, query: { ...to.query, ...carry } };
  });
});
onUnmounted(() => removeGuard?.());

function rgb(h) {
  const n = parseInt(h.slice(1, 7), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a, b, t) {
  const [r1, g1, b1] = rgb(a);
  const [r2, g2, b2] = rgb(b);
  const m = (x, y) => Math.round(x + (y - x) * t).toString(16).padStart(2, "0");
  return `#${m(r1, r2)}${m(g1, g2)}${m(b1, b2)}`;
}
function luminance(h) {
  const [r, g, b] = rgb(h).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
function onColor(h) {
  return contrast(h, "#000000") > contrast(h, "#ffffff") ? "#000000" : "#ffffff";
}
function grade(c) {
  return c >= 4.5 ? "text-green-400" : c >= 3 ? "text-yellow-300" : "text-red-400";
}

// Die echte Sekundärfarbe der Instanz, bevor Variante B sie überschreibt.
const secondaryOrig = ref("#1d9ecc");
onMounted(async () => {
  const css = await $fetch("/api/theme/css", { responseType: "text" });
  const m = /--ui-secondary:\s*([^;]+);/.exec(css);
  if (m) secondaryOrig.value = m[1].trim();
});

const style = computed(() => {
  if (off.value) return "";
  return [
    `:root { --proto-accent: ${accentLight.value}; --proto-on-accent: ${onColor(accentLight.value)}; --proto-secondary-orig: ${secondaryOrig.value}; }`,
    `.dark { --proto-accent: ${accentDark.value}; --proto-on-accent: ${onColor(accentDark.value)}; }`,
  ].join("\n");
});

useHead({
  htmlAttrs: {
    class: computed(() =>
      !isDev || off.value ? "" : `proto-accent-${variant.value}${hero.value ? " proto-hero-accent" : ""}`,
    ),
  },
  style: [{ key: "proto-accent", innerHTML: computed(() => (isDev ? style.value : "")) }],
});
</script>

<style>
/* PROTOTYPE #512: Rollen der Akzentfarbe je Variante. Wegwerfen. */

/* ---------- gemeinsam: Hintergrund und Hero (A und C) ---------- */
html:is(.proto-accent-A, .proto-accent-C) .poly-accent {
  fill: var(--proto-accent) !important;
}
html:is(.proto-accent-A, .proto-accent-C) .orb-3 {
  background: var(--proto-accent) !important;
}
html.proto-hero-accent:is(.proto-accent-A, .proto-accent-C) .hero-richtext span.hero-color-primary {
  color: var(--proto-accent) !important;
}

/* ---------- A: Hervorhebung ---------- */
html.proto-accent-A [data-accent="badge"] {
  background-color: var(--proto-accent) !important;
  color: var(--proto-on-accent) !important;
}
html.proto-accent-A [data-accent="badge-outline"] {
  color: var(--proto-accent) !important;
  --tw-ring-color: var(--proto-accent) !important;
}
html.proto-accent-A :is(.html-content a, footer nav a, a[class*="text-primary"]):not([class*="bg-[var(--color-primary)]"] *) {
  color: var(--proto-accent) !important;
}
html.proto-accent-A *:focus-visible {
  outline: 2px solid var(--proto-accent) !important;
  outline-offset: 2px;
  --tw-ring-color: var(--proto-accent) !important;
}

/* ---------- B: Zustand ---------- */
html.proto-accent-B {
  --ui-secondary: var(--proto-accent);
}
html.proto-accent-B *:focus-visible {
  outline: 2px solid var(--proto-accent) !important;
  outline-offset: 2px;
  --tw-ring-color: var(--proto-accent) !important;
}
html.proto-accent-B :is([role="checkbox"], [role="switch"], [role="radio"])[data-state="checked"],
html.proto-accent-B :is([aria-current="page"], [data-selected="true"]).bg-primary {
  background-color: var(--proto-accent) !important;
  color: var(--proto-on-accent) !important;
  border-color: var(--proto-accent) !important;
}
html.proto-accent-B [data-accent="badge"] {
  background-color: var(--proto-secondary-orig) !important;
  color: #fff !important;
}
html.proto-accent-B [data-accent="badge-outline"] {
  color: var(--proto-secondary-orig) !important;
  --tw-ring-color: var(--proto-secondary-orig) !important;
}
html.proto-accent-B [data-accent="stripe"],
html.proto-accent-B [data-accent="stripe"] * {
  border-color: var(--proto-secondary-orig) !important;
}
html.proto-accent-B .poly-accent {
  fill: var(--proto-secondary-orig) !important;
}

/* ---------- C: Dekor ---------- */
html.proto-accent-C [data-accent="stripe"],
html.proto-accent-C [data-accent="stripe"] * {
  border-color: var(--proto-accent) !important;
}
html.proto-accent-C [data-accent="icon"] {
  background-color: var(--proto-accent) !important;
}
html.proto-accent-C [data-accent="icon"] * {
  color: var(--proto-on-accent) !important;
}
html.proto-accent-C [data-accent="card"]:hover {
  --tw-ring-color: var(--proto-accent) !important;
}
</style>
