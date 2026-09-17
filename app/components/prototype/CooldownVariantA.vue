<template>
  <!-- PROTOTYPE A: countdown ring on the button, hold-to-refresh only during the Cooldown -->
  <div class="py-6">
    <div class="relative flex items-center justify-center mb-10">
      <div
        v-if="!flow.cooling && !flow.reading && !flow.action"
        class="absolute w-28 h-28 rounded-full border-[12px] animate-ping [animation-duration:2.5s]"
        :class="flow.variant === 'open' ? 'border-primary/30' : 'border-error/30'"
      />
      <svg class="absolute w-40 h-40 -rotate-90 pointer-events-none" viewBox="0 0 100 100">
        <template v-if="flow.cooling">
          <circle cx="50" cy="50" r="46" fill="none" stroke="#e5e7eb" stroke-width="3" />
          <circle
            cx="50" cy="50" r="46" fill="none" stroke="currentColor" stroke-width="3"
            stroke-linecap="round" :stroke-dasharray="RING" :stroke-dashoffset="RING * flow.cooldownProgress"
            class="text-neutral-500 transition-[stroke-dashoffset] duration-100 ease-linear"
          />
        </template>
        <circle
          v-if="holding"
          cx="50" cy="50" r="40" fill="none" stroke="currentColor" stroke-width="4"
          stroke-linecap="round" :stroke-dasharray="RING_INNER" :stroke-dashoffset="RING_INNER * (1 - progress)"
          class="text-primary"
        />
      </svg>

      <button
        type="button"
        class="controlButton rounded-full flex flex-col items-center justify-center shadow-lg text-white select-none touch-none outline-none focus-visible:ring-4 ring-primary/40"
        :class="[buttonClass, { shake: shaking }]"
        :aria-label="ariaLabel"
        v-bind="flow.cooling ? handlers : { onClick: () => flow.tap() }"
      >
        <template v-if="flow.reading">
          <div class="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <span class="text-xs mt-2">Status …</span>
        </template>
        <template v-else-if="flow.action">
          <div class="w-8 h-8 rounded-full border-4 border-white/30 border-t-white animate-spin" />
          <span class="text-xs mt-2">{{ flow.action === "open" ? "Öffnet …" : "Schließt …" }}</span>
        </template>
        <template v-else-if="flow.cooling">
          <span class="text-4xl font-semibold tabular-nums leading-none">{{ flow.cooldownSeconds }}</span>
          <span class="text-xs mt-1 opacity-80">{{ holding ? "halten …" : "Sekunden" }}</span>
        </template>
        <template v-else>
          <UIcon :name="flow.variant === 'open' ? 'i-lucide-unlock' : 'i-lucide-lock'" class="!text-[22px]" />
          <span class="text-sm font-medium mt-2">{{ flow.variant === "open" ? "Öffnen" : "Abschließen" }}</span>
        </template>
      </button>
    </div>

    <div class="text-center text-sm min-h-[4.5rem]">
      <template v-if="flow.cooling">
        <p class="font-medium">{{ nextLabel }} in {{ flow.cooldownSeconds }} s möglich</p>
        <p class="text-neutral-500 text-xs mt-1">Button gedrückt halten, um den Status zu prüfen</p>
      </template>
      <template v-else-if="flow.stage === 'error'">
        <p class="text-error font-medium">Status unbekannt</p>
        <UButton size="xs" variant="soft" class="mt-2" @click="flow.refreshStatus('Retry')">Erneut prüfen</UButton>
      </template>
      <template v-else>
        <p>Tippen Sie zum {{ flow.variant === "open" ? "Öffnen" : "Abschließen" }} von <b>Werkstatt-Tür</b></p>
      </template>
      <p v-if="flow.lastEvent === 'lock_busy'" class="text-amber-600 text-xs mt-2">
        Das Schloss ist noch beschäftigt. Die Wartezeit beginnt von vorn.
      </p>
      <p v-else-if="flow.lastEvent === 'refreshed' && flow.status" class="text-success text-xs mt-2">
        Status geprüft: {{ flow.status.open ? "geöffnet" : "abgeschlossen" }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { useHoldGesture } from "./cooldownPrototypeFlow.js";

const props = defineProps({ flow: { type: Object, required: true } });
const RING = 2 * Math.PI * 46;
const RING_INNER = 2 * Math.PI * 40;
const HOLD_MS = 600;

const shaking = ref(false);
const { holding, progress, handlers } = useHoldGesture({
  thresholdMs: HOLD_MS,
  onTap: async () => {
    if ((await props.flow.tap()) === "cooling") {
      shaking.value = true;
      setTimeout(() => (shaking.value = false), 450);
    }
  },
  onHold: () => props.flow.refreshStatus(),
});

const buttonClass = computed(() =>
  props.flow.cooling || props.flow.reading
    ? "coolColor"
    : props.flow.variant === "open"
      ? "openColor"
      : "closeColor",
);
const nextLabel = computed(() => (props.flow.variant === "open" ? "Öffnen" : "Abschließen"));
const ariaLabel = computed(() =>
  props.flow.cooling
    ? `${nextLabel.value} in ${props.flow.cooldownSeconds} Sekunden möglich. Halten, um den Status zu prüfen.`
    : nextLabel.value,
);
</script>
<style scoped>
.controlButton { width: 120px; height: 120px; position: relative; z-index: 10; cursor: pointer; }
.openColor { background: linear-gradient(180deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 85%, black)); }
.closeColor { background: linear-gradient(180deg, #f15d5d, color-mix(in srgb, #f15d5d 85%, black)); }
.coolColor { background: linear-gradient(180deg, #9ca3af, #6b7280); cursor: default; }
.shake { animation: shake 0.45s; }
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
</style>
