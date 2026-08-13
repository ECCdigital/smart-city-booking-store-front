<template>
  <!--
    PROTOTYP — Variante C: „Ein Bildschirm, der sich freischaltet".
    Kein Stepper, kein Bühnenwechsel. Der runde Knopf steht von Anfang an da, gesperrt.
    Darüber ein flacher Sucherstreifen. Der Scan entsperrt den Knopf — die Oberfläche
    behauptet nie, es gäbe zwei Schritte, sie zeigt eine Bedingung und ihre Erfüllung.
    Kamera startet sofort. Desktop: derselbe Aufbau, Streifen zeigt statt Kamera den
    Rückfallweg, Knopf bleibt gesperrt.
  -->
  <div class="w-full h-full flex flex-col gap-4">
    <!-- der Streifen: Kamera, Rückfallweg oder Quittung -->
    <div
      class="shrink-0 h-[30%] min-h-24 rounded-xl overflow-hidden border transition-colors duration-300"
      :class="stripBorder"
    >
      <!-- Desktop oder Kamera-Ausfall -> Rückfallweg im Streifen -->
      <div
        v-if="desktop || cameraError"
        class="w-full h-full flex items-center gap-3 px-4 bg-neutral-50 dark:bg-neutral-800"
      >
        <UIcon
          :name="desktop ? 'i-lucide-smartphone' : CAMERA_FAILURES[cameraError].icon"
          class="size-8 text-amber-600 shrink-0"
        />
        <div class="min-w-0">
          <p class="text-sm font-medium">
            {{ desktop ? FALLBACK_TITLE : CAMERA_FAILURES[cameraError].title }}
          </p>
          <p class="text-xs text-neutral-500">{{ FALLBACK_TEXT }}</p>
        </div>
      </div>

      <!-- Quittung: der Streifen schrumpft nicht, er wechselt den Inhalt -->
      <div
        v-else-if="unlocked"
        class="w-full h-full flex items-center gap-3 px-4 bg-green-50 dark:bg-green-950/30"
      >
        <UIcon name="i-lucide-check-circle-2" class="size-8 text-green-600 shrink-0" />
        <div class="min-w-0">
          <p class="text-sm font-medium">{{ accessPoint.label }} bestätigt</p>
          <p class="text-xs text-neutral-500">
            Sie stehen direkt davor. Der Knopf ist freigeschaltet.
          </p>
        </div>
      </div>

      <!-- laufender Scanner -->
      <PrototypeScanViewfinder
        v-else
        :simulated="simulated"
        @detect="onDetect"
        @error="onCameraError"
      >
        <div
          class="absolute inset-0 flex items-center justify-between px-4 pointer-events-none"
        >
          <p class="text-white text-sm font-medium drop-shadow">
            {{
              wrongDoor
                ? `Das ist ${wrongDoor.label}`
                : wrongTenant
                  ? "Anderer Anbieter"
                  : "Zum Entsperren scannen"
            }}
          </p>
          <UIcon
            :name="wrongDoor || wrongTenant ? 'i-lucide-tag' : 'i-lucide-scan-line'"
            class="size-7 shrink-0"
            :class="wrongDoor || wrongTenant ? 'text-amber-300' : 'text-white/80'"
          />
        </div>
      </PrototypeScanViewfinder>
    </div>

    <!-- Wechsel-Angebot bei falscher Tür -->
    <UButton
      v-if="wrongDoor"
      class="shrink-0"
      block
      color="warning"
      variant="subtle"
      icon="i-lucide-corner-up-right"
      :label="`Stattdessen ${wrongDoor.label} öffnen`"
      @click="emit('switchDoor', wrongDoor)"
    />

    <!-- der Knopf, immer sichtbar -->
    <div class="flex-1 min-h-0 flex flex-col items-center justify-center gap-4">
      <div class="relative flex items-center justify-center">
        <div
          v-if="unlocked && !opened"
          class="absolute size-28 rounded-full bg-primary/30 animate-ping [animation-duration:2.5s]"
        />
        <button
          class="relative size-30 rounded-full shadow-lg flex flex-col items-center justify-center transition-colors duration-500"
          :class="
            unlocked
              ? 'bg-primary text-white cursor-pointer'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-400 cursor-not-allowed'
          "
          :disabled="!unlocked"
          @click="opened = true"
        >
          <UIcon
            :name="
              opened
                ? 'i-lucide-check'
                : unlocked
                  ? 'i-lucide-unlock'
                  : 'i-lucide-lock'
            "
            class="size-6"
          />
          <span class="text-sm font-medium mt-1">
            {{ opened ? "Geöffnet" : unlocked ? "Öffnen" : "Gesperrt" }}
          </span>
        </button>
      </div>
      <p class="text-sm text-center px-6">
        <template v-if="unlocked">
          Tippen Sie zum Öffnen von
          <span class="font-semibold">{{ accessPoint.label }}</span>
        </template>
        <template v-else>
          <span class="font-semibold">{{ accessPoint.label }}</span>
          lässt sich erst öffnen, wenn Sie den Aufkleber davor gescannt haben.
        </template>
      </p>
    </div>
  </div>
</template>

<script setup>
import PrototypeScanViewfinder from "./PrototypeScanViewfinder.vue";
import {
  CAMERA_FAILURES,
  FALLBACK_TEXT,
  FALLBACK_TITLE,
  resolveStickerStub,
} from "./prototypeScanStubs.js";

const props = defineProps({
  accessPoint: { type: Object, required: true },
  desktop: { type: Boolean, default: false },
  simulated: { type: Boolean, default: false },
  injectedSticker: { type: String, default: "" },
  injectedCameraError: { type: String, default: "" },
});

const emit = defineEmits(["switchDoor"]);

const unlocked = ref(false);
const opened = ref(false);
const wrongDoor = ref(null);
const wrongTenant = ref(false);
const cameraError = ref("");

const stripBorder = computed(() => {
  if (wrongDoor.value || wrongTenant.value || cameraError.value) {
    return "border-amber-400";
  }
  if (unlocked.value) return "border-green-500";
  return "border-neutral-200 dark:border-neutral-700";
});

watch(() => props.injectedSticker, (raw) => raw && onDetect(raw));
watch(() => props.injectedCameraError, (name) => (cameraError.value = name));

function onDetect(raw) {
  const outcome = resolveStickerStub(raw);

  if (outcome.kind === "match") {
    wrongDoor.value = null;
    wrongTenant.value = false;
    unlocked.value = true;
    return;
  }

  if (outcome.kind === "wrong_door") {
    wrongDoor.value = outcome.accessPoint;
    return;
  }

  wrongTenant.value = true;
}

function onCameraError(name) {
  cameraError.value = name;
}

defineExpose({ reset });
function reset() {
  unlocked.value = false;
  opened.value = false;
  wrongDoor.value = null;
  wrongTenant.value = false;
  cameraError.value = "";
}
</script>
