<template>
  <!--
    PROTOTYP — Variante A: „Sucher ist die Bühne".
    Das Kamerabild füllt die ganze Bühnenfläche randlos. Stepper und Hinweis liegen als
    Overlay darauf. Kamera startet sofort. Nach dem Treffer friert das Bild ein und der
    runde Knopf fährt darüber ein — kein Zwischenschritt.
    Desktop zeigt gar keinen Scanner, sondern direkt den Rückfallweg.
  -->
  <div class="relative w-full h-full">
    <!-- Desktop: kein Scanner (Frage 5) -->
    <div
      v-if="desktop && phase !== 'opened'"
      class="w-full h-full flex flex-col items-center justify-center text-center gap-4 px-8"
    >
      <UIcon name="i-lucide-smartphone" class="size-12 text-primary" />
      <div>
        <h3 class="text-lg font-semibold">{{ FALLBACK_TITLE }}</h3>
        <p class="text-sm text-neutral-500 mt-1 max-w-sm">
          {{ accessPoint.label }} lässt sich nur vor Ort öffnen.
          {{ FALLBACK_TEXT }}
        </p>
      </div>
      <div class="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4">
        <UIcon name="i-lucide-qr-code" class="size-20 text-neutral-400" />
      </div>
    </div>

    <!-- Kamera-Ausfall: die ganze Fläche wird zum Rückfallweg -->
    <div
      v-else-if="cameraError"
      class="w-full h-full flex flex-col items-center justify-center text-center gap-4 px-8"
    >
      <UIcon
        :name="CAMERA_FAILURES[cameraError].icon"
        class="size-12 text-amber-500"
      />
      <div>
        <h3 class="text-lg font-semibold">
          {{ CAMERA_FAILURES[cameraError].title }}
        </h3>
        <p class="text-sm text-neutral-500 mt-1 max-w-sm">
          {{ FALLBACK_TEXT }}
        </p>
      </div>
      <UButton
        variant="subtle"
        icon="i-lucide-rotate-cw"
        label="Kamera erneut versuchen"
        @click="retryCamera"
      />
    </div>

    <!-- der runde Knopf, über dem eingefrorenen Standbild -->
    <template v-else>
      <PrototypeScanViewfinder
        :simulated="simulated"
        :paused="phase !== 'scanning'"
        @detect="onDetect"
        @error="onCameraError"
      >
        <!-- oben: Türname + Fortschritt, direkt auf dem Bild -->
        <div
          class="absolute inset-x-0 top-0 p-3 bg-gradient-to-b from-black/70 to-transparent"
        >
          <div class="flex gap-1.5 mb-2">
            <div class="flex-1 h-0.5 rounded-full bg-white" />
            <div
              class="flex-1 h-0.5 rounded-full transition-colors duration-500"
              :class="phase === 'scanning' ? 'bg-white/25' : 'bg-white'"
            />
          </div>
          <p class="text-white text-sm font-medium">{{ accessPoint.label }}</p>
        </div>

        <!-- Sucherfenster: nur ein Rahmen, das Bild bleibt frei -->
        <div
          v-if="phase === 'scanning'"
          class="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            class="w-40 h-40 rounded-2xl border-2 transition-colors duration-300"
            :class="wrongDoor ? 'border-amber-400' : 'border-white/80'"
          />
        </div>

        <!-- Treffer-Häkchen auf dem Standbild -->
        <div
          v-if="phase === 'matched' || phase === 'ready'"
          class="absolute inset-0 flex items-center justify-center"
        >
          <div
            class="size-16 rounded-full bg-green-600 flex items-center justify-center shadow-lg transition-all duration-300"
            :class="phase === 'ready' ? 'scale-50 opacity-0' : 'scale-100'"
          >
            <UIcon name="i-lucide-check" class="size-9 text-white" />
          </div>
        </div>

        <!-- unten: Hinweisband, wechselt bei falscher Tür die Farbe -->
        <div
          v-if="phase === 'scanning'"
          class="absolute inset-x-0 bottom-0 p-3"
          :class="
            wrongDoor
              ? 'bg-amber-500/90'
              : 'bg-gradient-to-t from-black/75 to-transparent'
          "
        >
          <template v-if="wrongDoor">
            <p class="text-white text-sm font-medium">
              Das ist der Aufkleber von {{ wrongDoor.label }}.
            </p>
            <div class="flex items-center gap-2 mt-2">
              <UButton
                size="xs"
                color="neutral"
                :label="`Zu ${wrongDoor.label} wechseln`"
                @click="emit('switchDoor', wrongDoor)"
              />
              <UButton
                size="xs"
                color="neutral"
                variant="ghost"
                class="text-white"
                label="Weiterscannen"
                @click="wrongDoor = null"
              />
            </div>
          </template>
          <template v-else-if="wrongTenant">
            <p class="text-white text-sm">
              Dieser Aufkleber gehört zu einem anderen Anbieter.
            </p>
          </template>
          <template v-else>
            <div class="flex items-end justify-between gap-3">
              <p class="text-white text-sm">
                QR-Code neben {{ accessPoint.label }} scannen
              </p>
              <button
                class="text-white/70 text-xs underline shrink-0"
                @click="cameraError = 'NotAllowedError'"
              >
                Geht nicht?
              </button>
            </div>
          </template>
        </div>

        <!-- der runde Knopf, direkt über dem Standbild -->
        <div
          v-if="phase === 'ready' || phase === 'opened'"
          class="absolute inset-0 flex flex-col items-center justify-center gap-4"
        >
          <button
            class="size-28 rounded-full bg-primary shadow-2xl flex flex-col items-center justify-center text-white"
            @click="phase = 'opened'"
          >
            <UIcon
              :name="phase === 'opened' ? 'i-lucide-check' : 'i-lucide-unlock'"
              class="size-6"
            />
            <span class="text-sm font-medium mt-1">
              {{ phase === "opened" ? "Geöffnet" : "Öffnen" }}
            </span>
          </button>
          <p class="text-white text-sm">
            Tippen Sie zum Öffnen von
            <span class="font-semibold">{{ accessPoint.label }}</span>
          </p>
        </div>
      </PrototypeScanViewfinder>
    </template>
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

const phase = ref("scanning"); // scanning | matched | ready | opened
const wrongDoor = ref(null);
const wrongTenant = ref(false);
const cameraError = ref("");

watch(() => props.injectedSticker, (raw) => raw && onDetect(raw));
watch(() => props.injectedCameraError, (name) => (cameraError.value = name));

function onDetect(raw) {
  const outcome = resolveStickerStub(raw);

  if (outcome.kind === "match") {
    wrongDoor.value = null;
    wrongTenant.value = false;
    phase.value = "matched";
    // kein Zwischenschritt: das Bild friert, dann kommt der Knopf
    setTimeout(() => (phase.value = "ready"), 700);
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

function retryCamera() {
  cameraError.value = "";
}

defineExpose({ reset });
function reset() {
  phase.value = "scanning";
  wrongDoor.value = null;
  wrongTenant.value = false;
  cameraError.value = "";
}
</script>
