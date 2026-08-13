<template>
  <div class="w-full flex flex-col">
    <!--
      One square, two possible contents: the camera, or - once it fails or the
      person asks for the other way - the fallback card. Same area, same place,
      only a different content (§ 5.3).
    -->
    <div
      class="relative aspect-square w-full max-w-[45vh] mx-auto overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-neutral-900"
    >
      <div
        v-if="fallbackCard"
        class="w-full h-full flex flex-col items-center justify-center gap-3 p-4 text-center bg-amber-50 dark:bg-amber-950/30"
      >
        <UIcon :name="fallbackCard.icon" class="size-8 text-amber-600" />
        <div>
          <p v-if="fallbackCard.title" class="font-medium text-sm">
            {{ fallbackCard.title }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {{
              t("mobileKey.evidence.camera.description", {
                label: accessPointLabel,
              })
            }}
          </p>
        </div>
      </div>

      <!--
        The camera starts with the stage, without a button in between: whoever
        sees this step has decided to scan (§ 5.2).
      -->
      <ClientOnly v-else>
        <QrcodeStream
          :formats="['qr_code']"
          :paused="resolving"
          :torch="torchOn"
          class="!w-full !h-full [&>video]:!object-cover"
          @detect="onDetect"
          @error="onCameraFailure"
          @camera-on="onCameraOn"
        />

        <template #fallback>
          <div class="w-full h-full flex items-center justify-center">
            <UIcon
              name="i-lucide-loader-circle"
              class="size-8 text-white/60 animate-spin"
            />
          </div>
        </template>
      </ClientOnly>

      <!-- Only where the camera reports one - iOS has none. -->
      <UButton
        v-if="torchAvailable && !fallbackCard"
        :icon="torchOn ? 'i-lucide-flashlight-off' : 'i-lucide-flashlight'"
        :aria-label="t('mobileKey.evidence.torch')"
        color="neutral"
        variant="solid"
        class="absolute bottom-3 right-3 cursor-pointer"
        @click="torchOn = !torchOn"
      />
    </div>

    <!--
      The misses stay inside this stage and the scanner keeps running: whoever
      caught the wrong sticker wants to scan again, not to work their way back
      from an error screen (§ 5.3).
    -->
    <UAlert
      v-if="lastMiss?.mismatch === 'wrong_door'"
      class="mt-3"
      color="warning"
      variant="subtle"
      icon="i-lucide-tag"
      :title="t('mobileKey.evidence.wrong_door.title')"
      :description="
        t('mobileKey.evidence.wrong_door.description', {
          scanned: scannedDoorLabel,
          label: accessPointLabel,
        })
      "
    >
      <template #actions>
        <UButton
          size="xs"
          color="warning"
          class="cursor-pointer"
          :label="
            t('mobileKey.evidence.wrong_door.action', {
              scanned: scannedDoorLabel,
            })
          "
          @click="switchToScannedDoor"
        />
      </template>
    </UAlert>

    <!-- No way out: a jump there would be an arrival at a stranger's tenant. -->
    <UAlert
      v-else-if="lastMiss?.mismatch === 'wrong_tenant'"
      class="mt-3"
      color="warning"
      variant="subtle"
      icon="i-lucide-circle-help"
      :title="t('mobileKey.evidence.wrong_tenant.title')"
      :description="t('mobileKey.evidence.wrong_tenant.description')"
    />

    <!--
      Permanent, whatever the camera is doing (§ 5.2) - but a control only
      while there is something to switch to. With the camera out, the card it
      would open already stands, so the line stays and the button does not.
    -->
    <p
      v-if="cameraFailure"
      class="mt-3 text-sm text-gray-600 dark:text-gray-300 text-left"
    >
      {{ t("mobileKey.evidence.fallback_link") }}
    </p>
    <button
      v-else
      type="button"
      class="mt-3 text-sm text-gray-600 dark:text-gray-300 underline text-left cursor-pointer"
      @click="fallbackRequested = !fallbackRequested"
    >
      {{
        t(
          fallbackRequested
            ? "mobileKey.evidence.back_to_camera"
            : "mobileKey.evidence.fallback_link",
        )
      }}
    </button>
  </div>
</template>

<script setup>
/**
 * The proof of presence, collected where the person stands: the camera reads
 * the sticker next to the door, the server says which door it belongs to, and
 * what comes back either is the proof or is one of three misses.
 *
 * Two jobs are deliberately not here. **Decoding** is the library's, and it
 * sits alone in this component so swapping it stays cheap (§ 5.1). **The
 * comparison** is `decideScanMatch`'s in `~/utils/accessOpenFlow.js`, where it
 * can be read and tested without a browser - this component hands over the
 * decoded string and shows what comes back.
 */
import { QrcodeStream, setZXingModuleOverrides } from "vue-qrcode-reader";

import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { decideScanMatch, readScannedCode } from "~/utils/accessOpenFlow.js";

// The WASM file would come from fastly.jsdelivr.net out of the box. Not
// acceptable for opening a door - it lies under public/wasm/ and has to match
// zxing-wasm@1.1.3 exactly (which is why both packages are pinned without a
// caret; npm overrides does not help here, it cannot swap the file along).
// See README.md.
setZXingModuleOverrides({
  locateFile: (path, prefix) =>
    path.endsWith(".wasm") ? `/wasm/${path}` : prefix + path,
});

const props = defineProps({
  /** Always explicit, never read off the access point (#21). */
  tenantId: {
    type: String,
    required: true,
  },
  /** The door the panel currently has open, as `readAccessPoint()` left it. */
  accessPoint: {
    type: Object,
    required: true,
  },
});

/** The proof, the moment there is one: `[{ type: "qrScan", scanCode }]`. */
const emit = defineEmits(["scanned"]);

const { resolveScan } = useAccessPoints();
const { t } = useI18n();

/**
 * The four camera failures that can be told apart at runtime. One card, four
 * headings, four separate `console.error`: no single one of them earns a way
 * out of its own, but logged apart they answer after two weeks how often each
 * actually happens - the number research 01 could not deliver.
 */
const CAMERA_FAILURES = Object.freeze({
  StreamApiNotSupportedError: {
    icon: "i-lucide-monitor-x",
    title: "unsupported",
    log: "Kamera nicht verfügbar (kein Secure Context oder Webview ohne Media-Capture):",
  },
  NotAllowedError: {
    icon: "i-lucide-camera-off",
    title: "denied",
    log: "Kamerazugriff verweigert:",
  },
  NotFoundError: {
    icon: "i-lucide-camera-off",
    title: "not_found",
    log: "Keine Kamera gefunden:",
  },
  NotReadableError: {
    icon: "i-lucide-camera-off",
    title: "not_readable",
    log: "Kamera wird bereits benutzt:",
  },
});

const cameraFailure = ref("");
const fallbackRequested = ref(false);
const torchAvailable = ref(false);
const torchOn = ref(false);

/**
 * The last scan that came back a miss, as one fact: which miss it was, the
 * door it named and the page that door is on. One ref rather than three, so
 * the alert cannot outlive the scan it belongs to.
 *
 * @type {import("vue").Ref<{ mismatch: string, label: string, path: string }|null>}
 */
const lastMiss = ref(null);

/** The one code being resolved right now - the picture holds while it is. */
const resolving = ref(false);

/**
 * The code the last answer belongs to. A sticker in front of a running camera
 * is decoded over and over; without this, every frame would ask the server the
 * same question again.
 */
const handledCode = ref("");

const accessPointLabel = computed(() => props.accessPoint.label || "Der Zugang");

/** A door that names none is still a door to switch to, just an unnamed one. */
const scannedDoorLabel = computed(
  () => lastMiss.value?.label || t("mobileKey.evidence.wrong_door.unnamed"),
);

/**
 * The card in place of the viewfinder - either because the camera failed, or
 * because the person asked for the way past it. Only a failure has a heading:
 * the way past it is not a fault worth naming.
 */
const fallbackCard = computed(() => {
  if (cameraFailure.value) {
    const failure =
      CAMERA_FAILURES[cameraFailure.value] ??
      CAMERA_FAILURES.StreamApiNotSupportedError;

    return {
      icon: failure.icon,
      title: t(`mobileKey.evidence.camera.${failure.title}`),
    };
  }

  return fallbackRequested.value
    ? { icon: "i-lucide-smartphone", title: "" }
    : null;
});

/**
 * A decoded picture, on its way to the comparison. Resolved against the
 * **scanned** tenant, never against this panel's own: only then does the answer
 * carry a foreign tenant, and only then can a foreign sticker be told from an
 * unreadable one (§ 5.3).
 */
async function onDetect(codes) {
  const rawValue = codes?.[0]?.rawValue;

  if (!rawValue || resolving.value || rawValue === handledCode.value) {
    return;
  }
  handledCode.value = rawValue;

  const scanned = readScannedCode(rawValue);
  if (!scanned) {
    // No sticker of ours. Nothing to say and nothing to ask the server - the
    // camera simply keeps looking. What the code said stays out of the log:
    // a wifi code carries a password, and it is none of our business.
    console.warn("Kein Zugangs-Aufkleber gescannt");
    lastMiss.value = null;
    return;
  }

  resolving.value = true;
  try {
    applyScanOutcome(
      decideScanMatch(await resolveScan(scanned.tenant, scanned.scanCode), {
        expectedAccessPointId: props.accessPoint.id,
        expectedTenantId: props.tenantId,
        scanCode: scanned.scanCode,
      }),
      scanned,
    );
  } catch (error) {
    console.error("Der gescannte Code konnte nicht aufgelöst werden:", error);
    // One failed answer must not put this sticker out of reach for good - the
    // next look at it asks again.
    handledCode.value = "";
    lastMiss.value = null;
  } finally {
    resolving.value = false;
  }
}

/**
 * What the comparison decided. A hit goes up as the proof and the stage moves
 * on without a step in between (§ 5.2); an unreadable answer says nothing,
 * because there is nothing about it the person could do differently.
 */
function applyScanOutcome(outcome, scanned) {
  lastMiss.value =
    outcome.matched || outcome.mismatch === "unreadable"
      ? null
      : {
          mismatch: outcome.mismatch,
          label: outcome.scannedLabel || "",
          path: scanned.path,
        };

  if (outcome.matched) {
    emit("scanned", outcome.evidence);
  }
}

/**
 * The way out of a wrong door: the landing page of the door just scanned. It
 * knows whether there is a booking for it; this panel does not (#18). The
 * scanned value already *is* that page - nothing is built here, only jumped to.
 */
function switchToScannedDoor() {
  navigateTo(lastMiss.value.path);
}

function onCameraFailure(error) {
  const failure = CAMERA_FAILURES[error?.name];

  if (failure) {
    console.error(failure.log, error.message);
  } else {
    console.error("Kamera-Ausfall:", error?.name, error?.message);
  }

  cameraFailure.value = error?.name || "StreamApiNotSupportedError";
}

/** The camera runs; whether it can light the door is its own to say. */
function onCameraOn(capabilities) {
  cameraFailure.value = "";
  torchAvailable.value = Boolean(capabilities?.torch);
}

/**
 * Without a secure context - and in a webview without media capture -
 * `navigator.mediaDevices` is simply not there. There is nothing to start
 * then, so the scanner is not shown at all and the card stands from the first
 * frame instead of after a failed attempt.
 */
onMounted(() => {
  if (!navigator.mediaDevices?.getUserMedia) {
    console.error(
      CAMERA_FAILURES.StreamApiNotSupportedError.log,
      "navigator.mediaDevices",
    );
    cameraFailure.value = "StreamApiNotSupportedError";
  }
});
</script>

<style scoped></style>
