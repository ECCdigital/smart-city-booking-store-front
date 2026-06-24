<template>
  <div>
    <!-- show multipe steps-->
    <AccessPointStepper
      v-if="accessPointStatus?.locked"
      :steps="accessSteps"
      :current-step="currentAccessStep"
    />

    <!-- verify location -->
    <AccessPointVerifyLocation
      v-if="!isVerified && accessPointStatus?.locked"
      v-model:verified="isVerified"
      :access-point="accessPoint"
      :booking-id="bookingId"
      @next-step="increaseStep"
    />

    <!-- open when closed and verified -->
    <div v-else-if="accessPointStatus?.locked && !hasResultState" class="py-10">
      <AccessPointControlButton
        variant="open"
        :access-point-label="accessPoint.label"
        @open="onOpenDoor"
      />
    </div>

    <!-- close when open -->
    <div
      v-else-if="!isVerified && accessPointStatus?.open && !hasResultState"
      class="py-10"
    >
      <AccessPointControlButton
        variant="close"
        :access-point-label="accessPoint.label"
        @lock="onLockDoor"
      />
    </div>

    <!-- loading -->
    <div v-if="isLoading">
      <AccessPointLoadingSpinner class="my-10" />
    </div>

    <!-- feedback for success or error -->
    <div class="flex flex-col gap-5 items-center justify-center my-5">
      <AccessPointFeedbackSection
        v-if="!isLoading && (successKey !== '' || errorKey !== '')"
        :is-success="successKey !== ''"
        :is-error="errorKey !== ''"
        :error-message="errorMessage"
        :variant="
          successKey !== '' && errorKey === ''
            ? successKey
            : errorKey !== '' && successKey === ''
              ? errorKey
              : ''
        "
        :access-point-label="accessPoint.label"
        @done="closeDialog"
      />
    </div>

    <!-- update status -->
    <UButton
      v-if="!isLoading && !(!isVerified && accessPointStatus?.locked)"
      variant="subtle"
      class="flex justify-center py-3 shadow-lg cursor-pointer w-full"
      @click="() => emit('status-updated')"
    >
      Status aktualisieren
    </UButton>

    <!-- help section -->
    <ProviderHelpSection
      :provider-id="accessPoint.provider"
      :tenant-id="accessPoint.tenant"
      :booking-id="bookingId"
    />
  </div>
</template>
<script setup>
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";
import AccessPointVerifyLocation from "~/components/mobileKey/AccessPointVerifyLocation.vue";
import AccessPointControlButton from "~/components/mobileKey/AccessPointControlButton.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointFeedbackSection from "~/components/mobileKey/AccessPointFeedbackSection.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  accessPointStatus: {
    type: Object,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
});
const emit = defineEmits(["close", "status-updated"]);
const { open, close } = useAccessPoints();

//State
const isLoading = ref(false);

const errorMessage = ref("");
const errorKey = ref("");
const successKey = ref("");

const hasResultState = computed(() => {
  return (
    isLoading.value === true ||
    errorMessage.value !== "" ||
    errorKey.value !== "" ||
    successKey.value !== ""
  );
});
function resetState() {
  errorKey.value = "";
  successKey.value = "";

  errorMessage.value = "";
}

//Steps
const isVerified = ref(false);
const currentAccessStep = ref(0);

const accessSteps = computed(() => {
  if (props.accessPoint.mode === "remote") {
    return [
      {
        value: "confirmLocation",
        label: "Standort bestätigen",
        description:
          "Bitte bestätigen Sie, dass Sie direkt vor der Tür stehen.",
      },
      {
        value: "openDoor",
        label: "Tür öffnen",
        description: "",
      },
    ];
  }
  return [];
});

function increaseStep() {
  currentAccessStep.value++;
}

//Actions
function closeDialog() {
  isVerified.value = false;

  emit("close");
}

async function onOpenDoor() {
  console.log("\u{231B} Tür wird geöffnet...");

  isLoading.value = true;
  resetState();

  try {
    const response = await open(
      props.accessPoint.tenant,
      props.accessPoint.id,
      props.bookingId,
    );

    if (response.data.state === "open") {
      successKey.value = "open";
    } else {
      errorKey.value = "open";
    }
  } catch (error) {
    errorKey.value = "open";
    console.error("\u{274C} API-Fehler beim Öffnen der Tür:");
    errorMessage.value =
      error?.statusMessage || error?.message || "Unbekannter API-Fehler";
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 3000);
  }
}
async function onLockDoor() {
  console.log("\u{1F513} Locking access point...");
  isLoading.value = true;

  resetState();

  try {
    const response = await close(
      props.accessPoint.tenant,
      props.accessPoint.id,
      props.bookingId,
    );

    if (response.data.state === "closed") {
      successKey.value = "close";
    } else {
      errorKey.value = "close";
    }
  } catch (error) {
    errorKey.value = "close";
    console.error("\u{274C} API-Fehler beim Schließen der Tür:");
    errorMessage.value =
      error?.statusMessage || error?.message || "Unbekannter API-Fehler";
  } finally {
    setTimeout(() => {
      isLoading.value = false;
    }, 3000);
  }
}
</script>

<style scoped></style>
