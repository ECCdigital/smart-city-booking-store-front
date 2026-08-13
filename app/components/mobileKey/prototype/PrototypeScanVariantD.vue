<template>
  <!--
    PROTOTYP — Variante D: die Entscheidung.
    Optik von B (Stepper oben, quadratischer Sucher, Rückfall-Link darunter),
    aber Kamera startet SOFORT und der Treffer führt OHNE Zwischenschritt zu Schritt 2.

    Wiederverwendet werden die bestehenden Komponenten unverändert:
      · `AccessPointStepper.vue`        — 1:1, wie im Listenweg
      · `AccessPointControlButton.vue`  — 1:1, Variante "open"
    Diese Datei zeigt, was aus `AccessPointVerifyLocation.vue` wird, wenn man sie
    erweitert statt ersetzt: Methodenauswahl raus, echter Scanner rein, Rest bleibt.
  -->
  <div class="w-full h-full flex flex-col">
    <div class="shrink-0">
      <AccessPointStepper :steps="STEPS" :current-step="step" />
    </div>

    <!-- Schritt 1 · Nachweis -->
    <div v-if="step === 0" class="flex-1 min-h-0 flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center">
        <div
          class="aspect-square h-full max-h-full max-w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700"
        >
          <!-- Kamera-Ausfall: der Sucherplatz wird zur Rückfallkarte (#22) -->
          <div
            v-if="cameraError"
            class="w-full h-full flex flex-col items-center justify-center text-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30"
          >
            <UIcon
              :name="CAMERA_FAILURES[cameraError].icon"
              class="size-8 text-amber-600"
            />
            <div>
              <p class="font-medium text-sm">
                {{ CAMERA_FAILURES[cameraError].title }}
              </p>
              <p class="text-xs text-neutral-500 mt-1">{{ FALLBACK_TEXT }}</p>
            </div>
          </div>

          <!-- Kamera läuft ab dem ersten Rendern -->
          <PrototypeScanViewfinder
            v-else
            :simulated="simulated"
            @detect="onDetect"
            @error="onCameraError"
          />
        </div>
      </div>

      <!-- falsche Tür / falscher Tenant: Meldung UNTER dem Sucher, Scanner läuft weiter -->
      <UAlert
        v-if="wrongDoor"
        class="mt-3 shrink-0"
        color="warning"
        variant="subtle"
        icon="i-lucide-tag"
        :title="`Aufkleber von ${wrongDoor.label}`"
        :description="`Das ist nicht ${accessPoint.label}.`"
      >
        <template #actions>
          <UButton
            size="xs"
            color="warning"
            :label="`Zu ${wrongDoor.label} wechseln`"
            @click="emit('switchDoor', wrongDoor)"
          />
        </template>
      </UAlert>
      <UAlert
        v-else-if="wrongTenant"
        class="mt-3 shrink-0"
        color="warning"
        variant="subtle"
        icon="i-lucide-circle-help"
        title="Anderer Anbieter"
        description="Dieser Aufkleber gehört nicht zu diesem Mandanten."
      />

      <button
        class="shrink-0 mt-3 text-xs text-neutral-500 underline text-left"
        @click="cameraError = cameraError || 'NotAllowedError'"
      >
        Kamera nicht möglich? {{ FALLBACK_TITLE }}
      </button>
    </div>

    <!-- Schritt 2 · Öffnen — der bestehende runde Knopf, unverändert -->
    <div v-else class="flex-1 min-h-0 overflow-y-auto flex flex-col justify-center pt-10">
      <AccessPointControlButton
        variant="open"
        :access-point-label="accessPoint.label"
        @open="opened = true"
      />
      <p v-if="opened" class="text-center text-sm text-green-600 mt-6">
        (Prototyp: hier übernähme der Ablauf und zeigte die Bühne „opening")
      </p>
    </div>
  </div>
</template>

<script setup>
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import AccessPointControlButton from "~/components/mobileKey/AccessPointControlButton.vue";
import PrototypeScanViewfinder from "./PrototypeScanViewfinder.vue";
import {
  CAMERA_FAILURES,
  FALLBACK_TEXT,
  FALLBACK_TITLE,
  resolveStickerStub,
} from "./prototypeScanStubs.js";

const STEPS = [
  {
    value: "confirmLocation",
    label: "Vor Ort nachweisen",
    description: "Scannen Sie den QR-Code direkt neben der Tür.",
  },
  {
    value: "openDoor",
    label: "Tür öffnen",
    description: "",
  },
];

const props = defineProps({
  accessPoint: { type: Object, required: true },
  desktop: { type: Boolean, default: false },
  simulated: { type: Boolean, default: false },
  injectedSticker: { type: String, default: "" },
  injectedCameraError: { type: String, default: "" },
});

const emit = defineEmits(["switchDoor"]);

const step = ref(0);
const opened = ref(false);
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
    step.value = 1; // ohne Zwischenschritt weiter
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
</script>
