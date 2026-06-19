<template>
  <div class="w-full flex flex-col">
    <div v-if="accessPoint.mode === 'remote'">
      <AccessPointStepper
        :steps="remoteAccessSteps"
        :current-step="currentAccessStep"
      />

      <!-- remote mode-->
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

        <div
          v-else-if="selectedAccessAction === 'deviceLocation'"
          class="mb-25"
        >
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
    </div>
    <USkeleton v-else class="h-64 w-full rounded-lg" />
  </div>
</template>
<script setup>
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import AccessActionButton from "~/components/mobileKey/AccessActionButton.vue";

const isVerified = defineModel("verified", {
  type: Boolean,
  default: false,
});
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

// ******************************************************
// ******************************************************
//toDo - TESTZWECKE!!!!
watch(selectedAccessAction, () => {
  console.log("Going to next step soon... ");
  setTimeout(() => {
    isVerified.value = true;
    currentAccessStep.value = 1;
  }, 2000);
});

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
</script>
<style scoped></style>
