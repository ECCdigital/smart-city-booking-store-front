<template>
  <!--
    PROTOTYP — Variante B: „Gestapelt, Kamera erst auf Tippen".
    Stepper oben (sichtbar), quadratischer Sucher in der Mitte, Rückfallweg permanent
    darunter. Die Kamera startet erst, wenn jemand sie startet — das Kamerarecht wird
    nicht ungefragt angefordert. Nach dem Treffer kommt eine ausdrückliche Bestätigung,
    erst danach Schritt 2 mit dem runden Knopf.
    Desktop: derselbe Aufbau, Webcam wird angeboten.
  -->
  <div class="w-full h-full flex flex-col">
    <!-- Stepper -->
    <div class="shrink-0">
      <div class="flex gap-2 mb-3">
        <div
          v-for="(_, idx) in STEPS"
          :key="idx"
          class="flex-1 h-1 rounded-full transition-colors duration-300"
          :class="idx <= step ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'"
        />
      </div>
      <div class="text-md font-semibold mb-1">
        Schritt {{ step + 1 }} von {{ STEPS.length }} &middot;
        {{ STEPS[step].label }}
      </div>
      <p class="text-sm text-neutral-500 mb-4">{{ STEPS[step].description }}</p>
    </div>

    <!-- Schritt 1 -->
    <div v-if="step === 0" class="flex-1 min-h-0 flex flex-col">
      <div class="flex-1 min-h-0 flex items-center justify-center">
        <div
          class="aspect-square h-full max-h-full max-w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700"
        >
          <!-- Kamera-Ausfall: der Sucherplatz wird zur Rückfallkarte -->
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

          <!-- Platzhalter: die Kamera läuft noch nicht -->
          <button
            v-else-if="!started"
            class="w-full h-full flex flex-col items-center justify-center gap-3 bg-neutral-100 dark:bg-neutral-800"
            @click="started = true"
          >
            <UIcon name="i-lucide-camera" class="size-8 text-neutral-400" />
            <span class="text-sm font-medium text-primary">Kamera starten</span>
            <span class="text-xs text-neutral-500 px-6 text-center">
              Sie werden gleich nach der Kameraerlaubnis gefragt.
            </span>
          </button>

          <!-- Bestätigungskarte statt Kamerabild -->
          <div
            v-else-if="matched"
            class="w-full h-full flex flex-col items-center justify-center gap-3 bg-green-50 dark:bg-green-950/30"
          >
            <UIcon name="i-lucide-check-circle-2" class="size-10 text-green-600" />
            <p class="font-medium">{{ accessPoint.label }} erkannt</p>
            <UButton
              label="Weiter"
              trailing-icon="i-lucide-arrow-right"
              @click="step = 1"
            />
          </div>

          <PrototypeScanViewfinder
            v-else
            :simulated="simulated"
            @detect="onDetect"
            @error="onCameraError"
          />
        </div>
      </div>

      <!-- falsche Tür / falscher Tenant: Alert UNTER dem Sucher, Scanner läuft weiter -->
      <UAlert
        v-if="wrongDoor"
        class="mt-3 shrink-0"
        color="warning"
        variant="subtle"
        icon="i-lucide-tag"
        :title="`Aufkleber von ${wrongDoor.label}`"
        description="Das ist nicht die Tür, die Sie geöffnet haben."
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

      <!-- Rückfallweg: immer da, aber unauffällig -->
      <button
        class="shrink-0 mt-3 text-xs text-neutral-500 underline text-left"
        @click="cameraError = cameraError || 'NotAllowedError'"
      >
        Kamera nicht möglich? {{ FALLBACK_TITLE }}
      </button>
    </div>

    <!-- Schritt 2 -->
    <div v-else class="flex-1 min-h-0 flex flex-col items-center justify-center gap-5">
      <button
        class="size-28 rounded-full bg-primary shadow-xl flex flex-col items-center justify-center text-white"
        @click="opened = true"
      >
        <UIcon
          :name="opened ? 'i-lucide-check' : 'i-lucide-unlock'"
          class="size-6"
        />
        <span class="text-sm font-medium mt-1">
          {{ opened ? "Geöffnet" : "Öffnen" }}
        </span>
      </button>
      <p class="text-sm text-center">
        Tippen Sie zum Öffnen von
        <span class="font-semibold">{{ accessPoint.label }}</span>
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

const STEPS = [
  {
    label: "Vor Ort nachweisen",
    description: "Scannen Sie den QR-Code direkt neben der Tür.",
  },
  { label: "Tür öffnen", description: "Nachweis erbracht." },
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
const started = ref(false);
const matched = ref(false);
const opened = ref(false);
const wrongDoor = ref(null);
const wrongTenant = ref(false);
const cameraError = ref("");

watch(() => props.injectedSticker, (raw) => {
  if (!raw) return;
  started.value = true;
  onDetect(raw);
});
watch(() => props.injectedCameraError, (name) => {
  if (!name) return;
  started.value = true;
  cameraError.value = name;
});

function onDetect(raw) {
  const outcome = resolveStickerStub(raw);

  if (outcome.kind === "match") {
    wrongDoor.value = null;
    wrongTenant.value = false;
    matched.value = true;
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
  step.value = 0;
  started.value = false;
  matched.value = false;
  opened.value = false;
  wrongDoor.value = null;
  wrongTenant.value = false;
  cameraError.value = "";
}
</script>
