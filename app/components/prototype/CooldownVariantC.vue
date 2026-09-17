<template>
  <!-- PROTOTYPE C: the button keeps its colour and shows a stopwatch; a tap in the Cooldown answers with a toast, holding (any time) reads the status with a ripple -->
  <div class="py-6 relative">
    <Transition name="toast">
      <div
        v-if="toast"
        class="absolute left-1/2 -translate-x-1/2 -top-2 z-20 rounded-full bg-neutral-900 text-white text-xs px-3 py-1.5 shadow whitespace-nowrap"
      >
        {{ toast }}
      </div>
    </Transition>

    <div class="relative flex items-center justify-center mb-10">
      <div
        v-if="!flow.cooling && !flow.action && !flow.reading"
        class="absolute w-28 h-28 rounded-full border-[12px] animate-ping [animation-duration:2.5s]"
        :class="flow.variant === 'open' ? 'border-primary/30' : 'border-error/30'"
      />
      <button
        type="button"
        class="controlButton rounded-full flex flex-col items-center justify-center shadow-lg text-white select-none touch-none overflow-hidden outline-none focus-visible:ring-4 ring-primary/40"
        :class="[flow.variant === 'open' ? 'openColor' : 'closeColor', { 'opacity-60': flow.cooling && !holding }]"
        :aria-label="ariaLabel"
        v-bind="handlers"
      >
        <span
          class="absolute inset-0 m-auto rounded-full bg-white/30"
          :style="{ transform: `scale(${holding ? progress : 0})`, transition: holding ? 'none' : 'transform 200ms' }"
        />
        <template v-if="flow.reading">
          <div class="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <span class="text-xs mt-2 relative">Status …</span>
        </template>
        <template v-else-if="flow.action">
          <div class="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <span class="text-xs mt-2 relative">{{ flow.action === "open" ? "Öffnet …" : "Schließt …" }}</span>
        </template>
        <template v-else-if="holding">
          <UIcon name="i-lucide-refresh-cw" class="!text-[22px] relative animate-spin [animation-duration:1.5s]" />
          <span class="text-xs mt-2 relative">Halten …</span>
        </template>
        <template v-else-if="flow.cooling">
          <UIcon name="i-lucide-timer" class="!text-[22px] relative" />
          <span class="text-lg font-semibold tabular-nums mt-1 relative">{{ flow.cooldownSeconds }} s</span>
        </template>
        <template v-else>
          <UIcon :name="flow.variant === 'open' ? 'i-lucide-unlock' : 'i-lucide-lock'" class="!text-[22px] relative" />
          <span class="text-sm font-medium mt-2 relative">{{ flow.variant === "open" ? "Öffnen" : "Abschließen" }}</span>
        </template>
      </button>
    </div>

    <div class="text-center text-sm min-h-[4.5rem]">
      <template v-if="flow.cooling">
        <p class="font-medium">Schloss arbeitet, {{ nextLabel }} erst in {{ flow.cooldownSeconds }} s</p>
      </template>
      <template v-else-if="flow.stage === 'error'">
        <p class="text-error font-medium">Status unbekannt, halten zum Prüfen</p>
      </template>
      <template v-else>
        <p>Tippen zum {{ nextLabel }} von <b>Werkstatt-Tür</b></p>
      </template>
      <p class="text-neutral-500 text-xs mt-1">Gedrückt halten: Status vom Schloss abfragen</p>
      <p v-if="flow.lastEvent === 'lock_busy'" class="text-amber-600 text-xs mt-2">
        Das Schloss war noch beschäftigt. Die Wartezeit beginnt von vorn.
      </p>
      <p v-else-if="flow.lastEvent === 'refreshed' && flow.status" class="text-success text-xs mt-2">
        Schloss meldet: {{ flow.status.open ? "geöffnet" : "abgeschlossen" }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { useHoldGesture } from "./cooldownPrototypeFlow.js";

const props = defineProps({ flow: { type: Object, required: true } });
const HOLD_MS = 800;
const toast = ref("");
let toastTimer;
function showToast(text) {
  toast.value = text;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (toast.value = ""), 1600);
}

const { holding, progress, handlers } = useHoldGesture({
  thresholdMs: HOLD_MS,
  onTap: async () => {
    if ((await props.flow.tap()) === "cooling") {
      showToast(`Bitte noch ${props.flow.cooldownSeconds} s warten, das Schloss arbeitet`);
    }
  },
  onHold: () => props.flow.refreshStatus(),
});

const nextLabel = computed(() => (props.flow.variant === "open" ? "Öffnen" : "Abschließen"));
const ariaLabel = computed(() =>
  props.flow.cooling
    ? `${nextLabel.value} erst in ${props.flow.cooldownSeconds} Sekunden. Halten, um den Status abzufragen.`
    : `${nextLabel.value}. Halten, um den Status abzufragen.`,
);
</script>
<style scoped>
.controlButton { width: 120px; height: 120px; position: relative; z-index: 10; cursor: pointer; }
.openColor { background: linear-gradient(180deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black)); }
.closeColor { background: linear-gradient(180deg, #f15d5d, color-mix(in srgb, #f15d5d 85%, black)); }
.toast-enter-active, .toast-leave-active { transition: opacity 200ms, transform 200ms; }
.toast-enter-from, .toast-leave-to { opacity: 0; transform: translate(-50%, 4px); }
</style>
