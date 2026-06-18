<template>
  <div class="w-full flex flex-col">
    <AccessPointStepper
      :steps="remoteAccessSteps"
      :current-step="currentAccessStep"
    />

    <!-- step 1: confirm location-->
    <div v-if="currentAccessStep === 0">
      <div v-if="!selectedAccessAction" class="space-y-3">
        <AccessActionButton
          v-for="action in accessActions"
          :key="action.value"
          :action="action"
          @select="() => (selectedAccessAction = action.value)"
        />
      </div>

      <div v-else-if="selectedAccessAction === 'qr'" class="mb-25">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          QR-Code scannen
        </p>

        <!-- ****************************************************** -->
        <!-- toDo - QR Code Scanner Component einbauen --->
        <!-- ****************************************************** -->
        <!-- ****************************************************** -->
        <UAlert
          icon="i-lucide-qr-code"
          color="primary"
          variant="subtle"
          title="QR-Code an der Tür scannen"
          description="Scannen Sie den QR-Code direkt neben der Tür, um Ihren Standort zu bestätigen."
          class="mb-4"
        />

        <ClientOnly>
          <QrcodeStream
            class="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700"
            @detect="onQrDetect"
            @error="onQrError"
          />
        </ClientOnly>

        <p v-if="qrError" class="mt-3 text-sm text-red-500">
          {{ qrError }}
        </p>
        <!-- ****************************************************** -->
        <!-- ****************************************************** -->
        <!-- ****************************************************** -->
      </div>

      <div v-else-if="selectedAccessAction === 'deviceLocation'" class="mb-25">
        <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
          Gerätestandort prüfen
        </p>
        <!-- toDo - Location Check Component einbauen --->
      </div>

      <UButton
        v-if="selectedAccessAction"
        label="Andere Methode wählen"
        icon="i-lucide-chevron-left"
        variant="ghost"
        class="px-0 text-sm"
        @click="() => (selectedAccessAction = '')"
      />
    </div>

    <!-- step 2: open door -->
    <div
      v-if="currentAccessStep === 1"
      class="flex flex-col items-center justify-center py-5"
    >
      <div
        v-if="loadingKey === '' && !openingError && !openingSuccess"
        class="space-y-6"
      >
        <AccessPointOpenButton @open="onOpenDoor" />
        <div class="text-center text-sm">
          <p class="mb-1">&check; Verifiziert</p>
          Tippen Sie zum Öffnen von
          <span class="font-semibold"> {{ accessPoint.label }} </span>
        </div>
      </div>
      <div v-else-if="loadingKey === 'requestOpeningKey'">
        <AccessPointLoadingSpinner />
      </div>
      <!-- opening success -->
      <div
        v-else-if="loadingKey === '' && openingSuccess"
        class="flex flex-col gap-5 items-center justify-center mb-5"
      >
        <OpenSuccessSection
            :access-point-label="accessPoint.label"
            @door-ready="onDoorIsReady"
        />
      </div>

      <!-- opening error -->
      <div
        v-else-if="loadingKey === '' && openingError"
        class="flex flex-col gap-5 items-center justify-center mb-5"
      >
        <div
          class="bg-error/40 w-24 h-24 z-15 rounded-full flex items-center justify-center"
        >
          <UIcon name="i-lucide-x" class="!text-[40px] text-gray-600" />
        </div>

        <div class="text-center text-sm mx-5">
          <p class="mb-1 text-lg font-semibold">Tür reagiert nicht</p>
          {{ accessPoint.label }} konnte nicht geöffnet werden. Bitte versuchen
          Sie es erneut.
        </div>

        <div
          v-if="errorMessage"
          class="bg-error/50 w-full rounded-xl text-sm mx-2 p-2"
        >
          <p class="mb-0.5 font-semibold text-red-800">Fehler:</p>
          {{ errorMessage }}
          <!-- toDo - wie sehen ErrorMessages aus? Welche Fehler können hier auftreten??? Anpassen -->
          <!--
          "Unauthorized" (wenn TenantID falsch),
          "Internetal Server Error" (wenn AccessPoint.ID falsch),
          "Forbidden" (Wenn BookingID falsch)
          -->
        </div>

        <UButton
          variant="solid"
          class="nextStepButton mt-1 flex justify-center py-3 shadow-lg cursor-pointer w-full"
          @click="onOpenDoor"
        >
          <UIcon name="i-lucide-unlock" class="!text-[15px]" />
          Erneut versuchen
        </UButton>
      </div>

      <!--
      <div class="bg-fuchsia-300 text-xs mx-2">{{ errorMessage }}</div>
      <div class="bg-fuchsia-400 text-xs mx-2">{{ accessPoint }}</div>
      -->
    </div>
  </div>
</template>
<script setup>
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointOpenButton from "~/components/mobileKey/AccessPointOpenButton.vue";
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import AccessActionButton from "~/components/mobileKey/AccessActionButton.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import OpenSuccessSection from "~/components/mobileKey/OpenSuccessSection.vue";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["closeSideover"]);

const { open } = useAccessPoints();

const errorMessage = ref("");
const loadingKey = ref("");

const openingError = ref(false);
const openingSuccess = ref(false);

const remoteAccessSteps = [
  {
    value: "confirmLocation",
    label: "Standort bestätigen",
    description: "Bitte bestätigen Sie, dass Sie direkt vor der Tür stehen.",
  },
  {
    value: "openDoor",
    label: "Tür öffnen",
    description: "",
  },
];
const currentAccessStep = ref(0);

const accessActions = [
  {
    value: "qr",
    icon: "i-lucide-qr-code",
    label: "QR-Code scannen",
    description: "Code an der Tür mit der Kamera erfassen.",
  },
  {
    value: "deviceLocation",
    icon: "i-lucide-locate",
    label: "Gerätestandort verwenden",
    description: "Automatisch prüfen, ob Sie sich vor der Tür befinden.",
  },
];
const selectedAccessAction = ref("");

// **************************
// **************************
//toDo - TESTZWECKE!!!!
watch(selectedAccessAction, () => {
  console.log("Going to next step soon... ");
  setTimeout(() => {
    currentAccessStep.value = 1;
  }, 2000);
});
// **************************
// **************************

// ******************************************************
// ******************************************************
// ******************************************************
const qrError = ref("");

function onQrDetect(detectedCodes) {
  const qrValue = detectedCodes[0]?.rawValue;

  if (!qrValue) {
    return;
  }

  console.log("QR erkannt:", qrValue);

  // Beispiel: QR-Code gegen Access Point prüfen
  if (qrValue !== props.accessPoint.qrCode) {
    qrError.value = "Dieser QR-Code gehört nicht zu der ausgewählten Tür.";
    return;
  }

  qrError.value = "";
  currentAccessStep.value = 1;
}

function onQrError(error) {
  console.error(error);

  qrError.value =
    "Die Kamera konnte nicht gestartet werden. Bitte erlauben Sie den Kamerazugriff.";
}
// ******************************************************
// ******************************************************
// ******************************************************

async function onOpenDoor() {
  console.log("\u{231B} Tür wird geöffnet...");
  loadingKey.value = "requestOpeningKey";
  errorMessage.value = "";
  openingSuccess.value = false;
  openingError.value = false;

  try {
    const response = await open(
      props.accessPoint.tenant,
      props.accessPoint.id ,
      props.bookingId +"12",
    );
    console.log("Open response:", response);

    if (response.data.state === "open") {
      openingSuccess.value = true;
      console.log("\u{2705} Tür erfolgreich geöffnet!");
    } else {
      openingError.value = true;
      console.error("\u{274C} Fehler beim Öffnen der Tür:", response.data);
    }
  } catch (error) {
    openingError.value = true;
    console.error("\u{274C} API-Fehler beim Öffnen der Tür:");
    errorMessage.value =
      error?.statusMessage || error?.message || "Unbekannter API-Fehler";
  } finally {
    loadingKey.value = "";
  }
}
function onDoorIsReady() {
  openingError.value = false;
  openingSuccess.value = false;
  errorMessage.value = "";

  emit("closeSideover");
}
</script>
<style scoped>
.nextStepButton {
  background: linear-gradient(
    180deg,
    var(--color-primary),
    color-mix(in srgb, var(--color-primary) 85%, black)
  );
}
</style>
