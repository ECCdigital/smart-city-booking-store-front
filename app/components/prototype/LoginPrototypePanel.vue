<template>
  <!--
    PROTOTYPE #513 (Karte #510): Logo und Portalname auf dem Login. Varianten
    0 (heute), A–D, umschaltbar per ?variant=. Der ganze Zustand steht in der
    URL. Nur im Dev-Modus und nur auf /login, nie in main.
  -->
  <div v-if="proto.isDev && route.path === '/login'">
    <PrototypeVariantSwitcher :variants="LOGIN_PROTO_VARIANTS" :names="LOGIN_PROTO_NAMES" />
    <div
      class="fixed top-3 right-3 z-[100] w-80 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl bg-neutral-900 text-white text-xs font-mono shadow-2xl border border-yellow-400"
    >
      <button class="w-full flex justify-between items-center px-3 py-2" @click="open = !open">
        <span><span class="text-yellow-300">PROTOTYPE #513</span> · {{ proto.variant.value }} {{ LOGIN_PROTO_NAMES[proto.variant.value] }}</span>
        <span>{{ open ? "–" : "+" }}</span>
      </button>
      <div v-if="open" class="px-3 pb-3 space-y-3">
        <p class="text-neutral-300 leading-snug">{{ LOGIN_PROTO_DESCRIPTIONS[proto.variant.value] }}</p>

        <fieldset class="space-y-1">
          <legend class="text-neutral-400">Hintergrund</legend>
          <label v-for="(label, key) in LOGIN_PROTO_BACKGROUNDS" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-bg" :checked="proto.bg.value === key" @change="proto.set({ bg: key })">
            {{ label }}
          </label>
          <label v-if="isImage" class="flex items-center gap-2 pl-5">
            Overlay dunkel
            <input
              type="range"
              min="0"
              max="90"
              step="10"
              :value="proto.overlay.value"
              @change="proto.set({ overlay: String($event.target.value) })"
            >
            {{ proto.overlay.value }} %
          </label>
        </fieldset>

        <fieldset class="space-y-1">
          <legend class="text-neutral-400">Logo</legend>
          <label v-for="(label, key) in LOGIN_PROTO_LOGOS" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-logo" :checked="proto.logo.value === key" @change="proto.set({ logo: key })">
            {{ label }}
          </label>
          <div v-if="proto.variant.value === 'B'" class="space-y-1">
            <div class="text-neutral-400">Grund hinter dem Logo</div>
            <label class="flex items-center gap-2">
              <input type="radio" name="proto-plate" :checked="proto.plate.value === 'keins'" @change="proto.set({ plate: undefined })">
              Kein eigener Grund
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" name="proto-plate" :checked="proto.plate.value === 'kopf'" @change="proto.set({ plate: 'kopf' })">
              Kopf über die ganze Breite
            </label>
            <label class="flex items-center gap-2">
              <input type="radio" name="proto-plate" :checked="proto.plate.value === 'logo'" @change="proto.set({ plate: 'logo' })">
              Platte nur um das Logo
            </label>
          </div>
          <label v-if="proto.variant.value === 'A'" class="flex items-center gap-2">
            <input type="checkbox" :checked="proto.panelLight.value" @change="proto.set({ panel: $event.target.checked ? 'hell' : undefined })">
            Panel auch im Dunkelmodus hell (ohne Invertierung)
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" :checked="proto.invert.value" :disabled="(proto.panelLight.value && proto.variant.value === 'A') || (proto.variant.value === 'B' && proto.plate.value !== 'keins')" @change="proto.set({ invert: $event.target.checked ? undefined : '0' })">
            Im Dunkelmodus invertieren (heute immer an)
          </label>
        </fieldset>

        <fieldset class="space-y-1" :disabled="proto.variant.value === '0'" :class="{ 'opacity-40': proto.variant.value === '0' }">
          <legend class="text-neutral-400">Größe des Logos</legend>
          <label v-for="(label, key) in LOGIN_PROTO_SIZES" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-size" :checked="proto.size.value === key" @change="proto.set({ size: key })">
            {{ label }}
          </label>
          <p class="text-neutral-500">Auf dem Telefon höchstens M.</p>
        </fieldset>

        <fieldset class="space-y-1">
          <legend class="text-neutral-400">Portalname</legend>
          <label class="flex items-center gap-2">
            <input type="checkbox" :checked="proto.longName.value" @change="proto.set({ name: $event.target.checked ? 'lang' : undefined })">
            Langer Name
          </label>
          <label v-if="['A', 'B', 'D'].includes(proto.variant.value)" class="flex items-center gap-2">
            <input type="checkbox" :checked="proto.titlePrimary.value" @change="proto.set({ titleColor: $event.target.checked ? 'primary' : undefined })">
            In Primär statt neutral
          </label>
        </fieldset>

        <table class="w-full text-[11px]"><tbody>
          <tr class="text-neutral-400"><td>Kontrast Titel</td><td>hell</td><td>dunkel</td></tr>
          <tr v-for="row in rows" :key="row.label">
            <td>{{ row.label }}</td>
            <td :class="grade(row.light)">{{ row.light.toFixed(1) }}</td>
            <td :class="grade(row.dark)">{{ row.dark.toFixed(1) }}</td>
          </tr>
        </tbody></table>
        <p class="text-neutral-500 leading-snug">
          Primär der Instanz: {{ primary }}. AA für großen Text: 3. Auf Bild und
          Generiert ist der Grund geschätzt, beim unruhigen Bild gibt es keinen.
        </p>

        <div class="space-y-1">
          <div class="text-neutral-400">Zustand</div>
          <pre class="whitespace-pre-wrap text-[10px] text-neutral-300">{{ state }}</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  LOGIN_PROTO_BACKGROUNDS,
  LOGIN_PROTO_DESCRIPTIONS,
  LOGIN_PROTO_LOGOS,
  LOGIN_PROTO_NAMES,
  LOGIN_PROTO_SIZES,
  LOGIN_PROTO_VARIANTS,
  contrast,
} from "~/composables/useLoginPrototype";

const route = useRoute();
const proto = useLoginPrototype();
const open = ref(true);

const isImage = computed(() => ["hell", "dunkel", "unruhig"].includes(proto.bg.value));

const primary = ref("#1d9ecc");
onMounted(async () => {
  const css = await $fetch("/api/theme/css", { responseType: "text" });
  const m = /--color-primary:\s*(#[0-9a-fA-F]{6})/.exec(css) ?? /--ui-primary:\s*(#[0-9a-fA-F]{6})/.exec(css);
  if (m) primary.value = m[1];
});

/** Der geschätzte Grund hinter dem Titel je Hintergrund, hell und dunkel. */
const GROUND = {
  hell: ["#fefce8", "#fefce8"],
  dunkel: ["#1e1b4b", "#1e1b4b"],
  generiert: ["#eef2f7", "#0f172a"],
  instanz: ["#eef2f7", "#0f172a"],
};
function darkened(hex, pct) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.round(c + (17 - c) * (pct / 100)).toString(16).padStart(2, "0");
  return `#${f((n >> 16) & 255)}${f((n >> 8) & 255)}${f(n & 255)}`;
}

const titleColors = computed(() => {
  const v = proto.variant.value;
  if (v === "0") return [primary.value, primary.value];
  if (v === "C") return proto.brightness.value === "dunkel" ? ["#ffffff", "#ffffff"] : ["#111827", "#ffffff"];
  if (v === "B" && proto.plate.value === "kopf") return proto.titlePrimary.value ? [primary.value, primary.value] : ["#111827", "#111827"];
  if (v === "A" && proto.panelLight.value) return proto.titlePrimary.value ? [primary.value, primary.value] : ["#111827", "#111827"];
  return proto.titlePrimary.value ? [primary.value, primary.value] : ["#111827", "#ffffff"];
});

const rows = computed(() => {
  const [tl, td] = titleColors.value;
  const v = proto.variant.value;
  if (v === "B" && proto.plate.value === "kopf") {
    return [{ label: "auf Kopf (weiß)", light: contrast(tl, "#ffffff"), dark: contrast(tl, "#ffffff") }];
  }
  if (v === "A" && proto.panelLight.value) {
    return [{ label: "auf Panel (weiß)", light: contrast(tl, "#ffffff"), dark: contrast(tl, "#ffffff") }];
  }
  if (v === "A" || v === "B" || v === "D") {
    // Glas, Karte und Band: fast deckend, hell slate-50, dunkel gray-900.
    return [{ label: "auf Fläche", light: contrast(tl, "#f8fafc"), dark: contrast(td, "#111827") }];
  }
  const ground = GROUND[proto.bg.value];
  if (!ground) {
    return [
      { label: "auf Weiß", light: contrast(tl, "#ffffff"), dark: contrast(td, darkened("#ffffff", proto.overlay.value)) },
      { label: "auf Schwarz", light: contrast(tl, "#000000"), dark: contrast(td, "#000000") },
    ];
  }
  const dark = isImage.value ? darkened(ground[1], proto.overlay.value) : ground[1];
  return [{ label: "auf Grund", light: contrast(tl, ground[0]), dark: contrast(td, dark) }];
});

function grade(c) {
  return c >= 4.5 ? "text-green-400" : c >= 3 ? "text-yellow-300" : "text-red-400";
}

const state = computed(() =>
  JSON.stringify(
    {
      variant: proto.variant.value,
      bg: proto.bg.value,
      overlay: isImage.value ? proto.overlay.value : undefined,
      logo: proto.logo.value,
      size: proto.variant.value === "0" ? "sm" : proto.size.value,
      invert: proto.invert.value,
      plate: proto.variant.value === "B" ? proto.plate.value : undefined,
      panel: proto.variant.value === "A" ? (proto.panelLight.value ? "hell" : "glass") : undefined,
      name: proto.longName.value ? "lang" : "Instanz",
      titleColor: titleColors.value,
    },
    null,
    1,
  ),
);
</script>
