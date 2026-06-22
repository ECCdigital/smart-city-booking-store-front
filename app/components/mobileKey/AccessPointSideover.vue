<template>
  <USlideover
    v-model:open="isOpenSlideover"
    :title="`Zugangspunkt ${accessPoint.label}`"
    :description="`Details und Aktionen für Zugangspunkt ${accessPoint.label}`"
    side="bottom"
    inset
    :close="{
      color: 'primary',
      variant: 'ghost',
    }"
    :ui="{
      wrapper: 'bg-black/60',
      content: 'w-[90vw] mx-auto rounded-t-2xl shadow-lg',
    }"
  >
    <UButton
      label="Öffnen"
      trailing-icon="i-lucide-chevron-right"
      variant="ghost"
      color="primary"
      size="md"
      :disabled="denyAccess"
      :ui="{
        label: denyAccess ? 'text-gray-400' : '',
        trailingIcon: denyAccess ? 'text-gray-400' : '',
      }"
    />

    <template #header>
      <div class="flex w-full items-center gap-2 justify-between">
        <AccessPointLabel
          :access-point="accessPoint"
          :is-open="accessPointStatus?.open"
          :is-locked="accessPointStatus?.locked"
        />
        <UButton
          trailing-icon="i-lucide-x"
          variant="ghost"
          color="primary"
          size="md"
          @click="onCloseSlideover"
        />
      </div>
    </template>

    <template #body>
      <div class="pb-5 h-[60vh]">
        <!--
        <div class="text-sm bg-pink-400">{{accessPoint}}</div>

        <div class="text-sm bg-pink-300">
          verified: {{ isVerified }} <br >
          open: {{ accessPointStatus.open }} <br >
          locked: {{ accessPointStatus.locked }}
        </div>
        -->

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
        <div
          v-else-if="accessPointStatus?.locked && !hasResultState"
          class="py-10"
        >
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

        <div class="flex flex-col gap-5 items-center justify-center my-5">
          <!-- success or error message -->
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
            @done="onCloseSlideover"
          />
        </div>

        <UButton
            v-if="!isLoading && !(!isVerified && accessPointStatus?.locked)"
          variant="subtle"
          class="flex justify-center py-3 shadow-lg cursor-pointer w-full"
          @click="loadStatus"
        >
          Status aktualisieren
        </UButton>

        <ProviderHelpSection
          :provider-id="accessPoint.provider"
          :tenant-id="accessPoint.tenant"
          :booking-id="bookingId"
        />
      </div>
    </template>
  </USlideover>
</template>
<script setup>
import AccessPointLabel from "~/components/mobileKey/AccessPointLabel.vue";
import AccessPointVerifyLocation from "~/components/mobileKey/AccessPointVerifyLocation.vue";
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import AccessPointControlButton from "~/components/mobileKey/AccessPointControlButton.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";
import AccessPointFeedbackSection from "~/components/mobileKey/AccessPointFeedbackSection.vue";
import ProviderHelpSection from "~/components/mobileKey/ProviderHelpSection.vue";
import AccessPointStepper from "~/components/mobileKey/AccessPointStepper.vue";

const props = defineProps({
  accessPoint: {
    type: Object,
    required: true,
  },
  bookingId: {
    type: String,
    required: true,
  },
  denyAccess: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["closed"]);

const { open, close, getStatus } = useAccessPoints();

const isOpenSlideover = ref(false);

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
const currentAccessStep = ref(0);

const isVerified = ref(false);
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

const accessPointStatus = ref(null);
watch(isOpenSlideover, async (newValue) => {
  //toDo - Status auch bei IFBS laden?!?!?!?!?!??!?!?!?!
  //toDo - Status auch bei IFBS laden?!?!?!?!?!??!?!?!?!
  //toDo - Status auch bei IFBS laden?!?!?!?!?!??!?!?!?!
  if (newValue && props.accessPoint.provider !== "ifbs") {
    await loadStatus();
  }
});
async function loadStatus() {
  isLoading.value = true;

  try {
    const response = await getStatus(
      props.accessPoint.tenant,
      props.accessPoint.id,
      props.bookingId,
    );
    console.log("Access Point Status Response:", response);
    accessPointStatus.value = response.success ? response.data : null;

    if (accessPointStatus.value?.open) {
      isVerified.value = false;
    }
  } catch (e) {
    console.error("Error fetching access point status:", e);
    accessPointStatus.value = null;
  } finally {
    resetState();
    isLoading.value = false;
  }
}

function increaseStep() {
  currentAccessStep.value++;
}
function resetState() {
  errorKey.value = "";
  successKey.value = "";

  errorMessage.value = "";
}

function onCloseSlideover() {
  isOpenSlideover.value = false;
  isVerified.value = false;
  isLoading.value = false;

  resetState();
  emit("closed");
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
