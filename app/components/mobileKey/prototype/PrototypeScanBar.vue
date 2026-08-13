<template>
  <!--
    PROTOTYP — die Schaltleiste. Bewusst hässlich und hochkontrastig, damit sie nie mit
    dem Entwurf verwechselt wird, den sie zeigt. Sie sitzt OBEN statt unten, weil der
    mobile Slideover den unteren Bildschirmrand belegt — genau die Fläche, um die es geht.
    In Produktion wird sie nicht gerendert.
  -->
  <Teleport to="body">
    <div
      v-if="!isProduction"
      class="fixed top-0 inset-x-0 z-[9999] bg-fuchsia-700 text-white text-xs font-mono shadow-2xl"
    >
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2">
        <!-- Variante -->
        <div class="flex items-center gap-1">
          <button class="px-2 py-0.5 rounded bg-white/20" @click="cycle(-1)">
            ←
          </button>
          <span class="min-w-56 text-center font-bold">
            {{ current }} — {{ VARIANTS[current] }}
          </span>
          <button class="px-2 py-0.5 rounded bg-white/20" @click="cycle(1)">
            →
          </button>
        </div>

        <span class="opacity-40">|</span>

        <!-- Rahmen -->
        <button
          class="px-2 py-0.5 rounded"
          :class="desktop ? 'bg-white/20' : 'bg-white text-fuchsia-800 font-bold'"
          @click="emit('update:desktop', false)"
        >
          Slideover 60vh
        </button>
        <button
          class="px-2 py-0.5 rounded"
          :class="desktop ? 'bg-white text-fuchsia-800 font-bold' : 'bg-white/20'"
          @click="emit('update:desktop', true)"
        >
          Modal 50vw×60vh
        </button>

        <span class="opacity-40">|</span>

        <!-- Kamera -->
        <button
          class="px-2 py-0.5 rounded"
          :class="simulated ? 'bg-white/20' : 'bg-white text-fuchsia-800 font-bold'"
          @click="emit('update:simulated', false)"
        >
          echte Kamera
        </button>
        <button
          class="px-2 py-0.5 rounded"
          :class="simulated ? 'bg-white text-fuchsia-800 font-bold' : 'bg-white/20'"
          @click="emit('update:simulated', true)"
        >
          simuliert
        </button>
      </div>

      <div
        class="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-3 py-2 bg-fuchsia-900"
      >
        <span class="opacity-70">Aufkleber:</span>
        <button class="px-2 py-0.5 rounded bg-white/20" @click="scan('match')">
          richtige Tür
        </button>
        <button class="px-2 py-0.5 rounded bg-white/20" @click="scan('wrongDoor')">
          falsche Tür
        </button>
        <button class="px-2 py-0.5 rounded bg-white/20" @click="scan('wrongTenant')">
          falscher Tenant
        </button>

        <span class="opacity-40">|</span>

        <span class="opacity-70">Kamera-Ausfall:</span>
        <button
          v-for="(failure, name) in CAMERA_FAILURES"
          :key="name"
          class="px-2 py-0.5 rounded bg-white/20"
          :title="failure.hint"
          @click="emit('cameraError', name)"
        >
          {{ name.replace("Error", "") }}
        </button>

        <span class="opacity-40">|</span>

        <button
          class="px-2 py-0.5 rounded bg-white text-fuchsia-800 font-bold"
          @click="emit('reset')"
        >
          zurücksetzen
        </button>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { CAMERA_FAILURES, STICKERS } from "./prototypeScanStubs.js";

const VARIANTS = {
  A: "Sucher ist die Bühne",
  B: "Gestapelt, Kamera auf Tippen",
  C: "Ein Bildschirm, der sich freischaltet",
  D: "★ Entscheidung: B-Optik, Kamera sofort, echter Knopf",
};

const props = defineProps({
  current: { type: String, required: true },
  desktop: { type: Boolean, required: true },
  simulated: { type: Boolean, required: true },
});

const emit = defineEmits([
  "update:current",
  "update:desktop",
  "update:simulated",
  "scan",
  "cameraError",
  "reset",
]);

const isProduction = import.meta.env.PROD;
const keys = Object.keys(VARIANTS);

function cycle(delta) {
  const next = (keys.indexOf(props.current) + delta + keys.length) % keys.length;
  emit("update:current", keys[next]);
}

function scan(sticker) {
  emit("scan", STICKERS[sticker]);
}

function onKey(event) {
  const tag = document.activeElement?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (document.activeElement?.isContentEditable) return;

  if (event.key === "ArrowLeft") cycle(-1);
  if (event.key === "ArrowRight") cycle(1);
}

onMounted(() => window.addEventListener("keydown", onKey));
onBeforeUnmount(() => window.removeEventListener("keydown", onKey));
</script>
