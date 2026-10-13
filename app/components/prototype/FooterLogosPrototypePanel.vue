<template>
  <!--
    PROTOTYPE #514 (Karte #510): Logos im Footer. Varianten 0 (heute), A–D,
    umschaltbar per ?variant=. Der ganze Zustand steht in der URL. Nur im
    Dev-Modus, nie in main.
  -->
  <div v-if="proto.isDev">
    <PrototypeVariantSwitcher :variants="FOOTER_PROTO_VARIANTS" :names="FOOTER_PROTO_NAMES" />
    <div
      class="fixed top-3 right-3 z-[100] w-80 max-h-[calc(100vh-5rem)] overflow-y-auto rounded-xl bg-neutral-900 text-white text-xs font-mono shadow-2xl border border-yellow-400"
    >
      <button class="w-full flex justify-between items-center px-3 py-2" @click="open = !open">
        <span><span class="text-yellow-300">PROTOTYPE #514</span> · {{ proto.variant.value }} {{ FOOTER_PROTO_NAMES[proto.variant.value] }}</span>
        <span>{{ open ? "–" : "+" }}</span>
      </button>
      <div v-if="open" class="px-3 pb-3 space-y-3">
        <p class="text-neutral-300 leading-snug">{{ FOOTER_PROTO_DESCRIPTIONS[proto.variant.value] }}</p>
        <button class="underline text-yellow-300" @click="scrollDown">↓ zum Footer</button>

        <fieldset class="space-y-1">
          <legend class="text-neutral-400">Logos</legend>
          <label v-for="(s, key) in FOOTER_PROTO_SETS" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-set" :checked="proto.logoSet.value === key" @change="proto.set({ set: key })">
            {{ s.label }}
          </label>
        </fieldset>

        <fieldset class="space-y-1" :disabled="off" :class="{ 'opacity-40': off }">
          <legend class="text-neutral-400">Größenregel</legend>
          <label v-for="(label, key) in FOOTER_PROTO_RULES" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-rule" :checked="proto.rule.value === key" @change="proto.set({ rule: key })">
            {{ label }}
          </label>
          <p class="text-neutral-500">Standard der Variante: {{ FOOTER_PROTO_RULES[FOOTER_PROTO_DEFAULT_RULE[proto.variant.value]] ?? "–" }}</p>
        </fieldset>

        <fieldset class="space-y-1" :disabled="off" :class="{ 'opacity-40': off }">
          <legend class="text-neutral-400">Größe · Grundhöhe {{ proto.baseHeight.value }} px (Telefon × 0,8)</legend>
          <div class="flex gap-3">
            <label v-for="(label, key) in FOOTER_PROTO_SIZES" :key="key" class="flex items-center gap-1">
              <input type="radio" name="proto-size" :checked="proto.size.value === key" @change="proto.set({ size: key })">
              {{ label }}
            </label>
          </div>
        </fieldset>

        <fieldset class="space-y-1" :disabled="off || proto.variant.value === 'D'" :class="{ 'opacity-40': off || proto.variant.value === 'D' }">
          <legend class="text-neutral-400">Dunkelmodus, Logo ohne Variante</legend>
          <label v-for="(label, key) in FOOTER_PROTO_DARK" :key="key" class="flex items-center gap-2">
            <input type="radio" name="proto-dark" :checked="proto.dark.value === key" @change="proto.set({ dark: key })">
            {{ label }}
          </label>
          <label class="flex items-center gap-2">
            <input type="checkbox" :checked="proto.darkVariant.value" @change="proto.set({ dv: $event.target.checked ? '1' : undefined })">
            Förderlogo mit Variante für dunkel
          </label>
          <p class="text-neutral-500 leading-snug">
            BMWSB-Leitfaden: „immer auf weißem Grund“, keine Negativdarstellung,
            keine Variante für dunkel vorgesehen.
          </p>
        </fieldset>

        <label class="flex items-center gap-2">
          <input type="checkbox" :checked="proto.links.value" @change="proto.set({ links: $event.target.checked ? '1' : undefined })">
          Logos verlinkt (Hover, Fokusring)
        </label>

        <div class="space-y-1">
          <div class="text-neutral-400">Gerendert · Fenster {{ viewport }} px</div>
          <table class="w-full text-[11px]"><tbody>
            <tr class="text-neutral-400"><td>Logo</td><td>B × H</td><td>Text</td><td>mm</td></tr>
            <tr v-for="row in measured" :key="row.key">
              <td>{{ row.key }}</td>
              <td>{{ row.w }}×{{ row.h }}</td>
              <td :class="row.text ? grade(row.text) : ''">{{ row.text ? row.text.toFixed(1) : "–" }}</td>
              <td :class="row.key === 'foerder' ? (row.mm >= 62.5 ? 'text-green-400' : 'text-red-400') : ''">{{ row.mm.toFixed(0) }}</td>
            </tr>
          </tbody></table>
          <p class="text-neutral-500 leading-snug">
            Text: kleinste Schrift im Bild in px (grün ab 9, gelb ab 7).
            mm bei 96 dpi. Der BMWSB-Leitfaden verlangt für Druck mind. 62,5 mm
            Breite für die Logogruppe.
          </p>
        </div>

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
  FOOTER_PROTO_DARK,
  FOOTER_PROTO_DEFAULT_RULE,
  FOOTER_PROTO_DESCRIPTIONS,
  FOOTER_PROTO_LOGOS,
  FOOTER_PROTO_NAMES,
  FOOTER_PROTO_RULES,
  FOOTER_PROTO_SETS,
  FOOTER_PROTO_SIZES,
  FOOTER_PROTO_VARIANTS,
} from "~/composables/useFooterLogosPrototype";

const route = useRoute();
const proto = useFooterLogosPrototype();
const open = ref(true);
const off = computed(() => proto.variant.value === "0");

const measured = ref([]);
const viewport = ref(0);

/** Misst jedes sichtbare Logo nach jeder Änderung und bei jedem Resize. */
function measure() {
  viewport.value = window.innerWidth;
  const rows = [];
  for (const img of document.querySelectorAll("[data-proto-logo]")) {
    if (!img.offsetParent) continue;
    const r = img.getBoundingClientRect();
    const logo = FOOTER_PROTO_LOGOS[img.dataset.protoLogo];
    // Bei object-contain füllt das Bild die Box nicht ganz: tatsächliche Höhe.
    const scale = Math.min(r.width / logo.width, r.height / logo.height);
    const drawnH = logo.height * scale;
    const drawnW = logo.width * scale;
    rows.push({
      key: img.dataset.protoLogo,
      w: Math.round(drawnW),
      h: Math.round(drawnH),
      text: logo.textRatio ? drawnH * logo.textRatio : 0,
      mm: drawnW / 3.78,
    });
  }
  measured.value = rows;
}

let timer;
const schedule = () => {
  clearTimeout(timer);
  timer = setTimeout(measure, 120);
};
watch(() => route.fullPath, schedule);
onMounted(() => {
  window.addEventListener("resize", schedule);
  new MutationObserver(schedule).observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  schedule();
});
onUnmounted(() => window.removeEventListener("resize", schedule));

function grade(px) {
  return px >= 9 ? "text-green-400" : px >= 7 ? "text-yellow-300" : "text-red-400";
}

function scrollDown() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
}

const state = computed(() =>
  JSON.stringify(
    {
      variant: proto.variant.value,
      set: proto.logoSet.value,
      rule: proto.rule.value,
      size: proto.size.value,
      baseHeight: proto.baseHeight.value,
      dark: proto.variant.value === "D" ? "Band immer hell" : proto.dark.value,
      foerderDarkVariant: proto.darkVariant.value,
      links: proto.links.value,
    },
    null,
    1,
  ),
);
</script>
