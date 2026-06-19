<template>
  <USlideover
    v-model:open="isOpenSlideover"
    :title="accessPoint.label"
    :description="`Details und Aktionen für Zugangspunkt ${accessPoint.label}`"
    side="bottom"
    inset
    :close="{
      color: 'primary',
      variant: 'ghost',
    }"
    :ui="{
      wrapper: 'bg-black/70',
      content: 'w-[90vw] mx-auto rounded-t-2xl',
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
        <!-- verify location -->
        <AccessPointVerifyLocation
          v-if="!isVerified && accessPointStatus?.locked"
          v-model:verified="isVerified"
          :access-point="accessPoint"
          :booking-id="bookingId"
        />

        <!-- open when closed and verified -->
        <div
          v-else-if="isVerified && accessPointStatus?.locked && !hasResultState"
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

        <!-- toDo - add help information !!!!!!!!!!!!!!!!!!!!!!!!!! -->
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

const openingError = ref(false);
const openingSuccess = ref(false);
const closingError = ref(false);
const closingSuccess = ref(false);

const accessPointStatus = ref(null);
watch(isOpenSlideover, async (newValue) => {
  if (newValue) {
    isLoading.value = true;
    try {
      const response = await getStatus(
        props.accessPoint.tenant,
        props.accessPoint.id,
        props.bookingId,
      );
      console.log("Access Point Status Response:", response);
      accessPointStatus.value = response.success ? response.data : null;
    } catch (e) {
      console.error("Error fetching access point status:", e);
      accessPointStatus.value = null;
    } finally {
      isLoading.value = false;
    }
  }
});

function resetState() {
  errorKey.value = "";
  successKey.value = "";

  openingError.value = false;
  openingSuccess.value = false;
  closingError.value = false;
  closingSuccess.value = false;
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
