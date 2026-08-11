<template>
  <div class="lg:hidden">
    <USlideover
      v-model:open="isOpenSlideover"
      side="bottom"
      inset
      :title="accessPoint.label"
      description="Informationen und Status des Schließsystems"
      :ui="{
        wrapper: 'bg-black/60',
        content: 'w-[90vw] mx-auto rounded-t-2xl shadow-lg',
      }"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #header>
        <DialogTitle class="sr-only">
          {{ accessPoint.label }}
        </DialogTitle>

        <DialogDescription class="sr-only">
          Informationen und Status des Schließsystems
        </DialogDescription>

        <AccessPointPanelContentHeader
          :access-point="accessPoint"
          :access-point-status="accessPointStatus"
          @close="onCloseDialog"
        />
      </template>
      <template #body>
        <AccessPointLoadingSpinner v-if="isLoading" class="my-10" />

        <div v-else class="pb-5 h-[60vh]">
          <AccessPointPanelContentBody
            v-model="isVerified"
            :access-point="accessPoint"
            :access-point-status="accessPointStatus"
            :booking-id="bookingId"
            @status-updated="loadStatus"
            @close="onCloseDialog"
          />
        </div>
      </template>
    </USlideover>
  </div>

  <div class="hidden lg:flex">
    <UModal
      v-model:open="isOpenPopup"
      :ui="{
        overlay: 'bg-black/60',
        content: 'w-[50vw] max-w-[80vw] h-[60vh] shadow-lg',
      }"
      :title="accessPoint.label"
      description="Informationen und Status des Schließsystems"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #content>
        <div class="h-full overflow-y-auto p-5">
          <DialogTitle class="sr-only">
            {{ accessPoint.label }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Informationen und Status des Schließsystems
          </DialogDescription>

          <AccessPointLoadingSpinner v-if="isLoading" class="my-10" />
          <div v-else>
            <AccessPointPanelContentHeader
              :access-point="accessPoint"
              :access-point-status="accessPointStatus"
              @close="onCloseDialog"
            />
            <USeparator class="my-5" />
            <AccessPointPanelContentBody
              v-model="isVerified"
              :access-point="accessPoint"
              :access-point-status="accessPointStatus"
              :booking-id="bookingId"
              @status-updated="loadStatus"
              @close="onCloseDialog"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
<script setup>
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { DialogTitle, DialogDescription } from "reka-ui";

import AccessPointPanelButton from "~/components/mobileKey/AccessPointPanelButton.vue";
import AccessPointPanelContentHeader from "~/components/mobileKey/AccessPointPanelContentHeader.vue";
import AccessPointPanelContentBody from "~/components/mobileKey/AccessPointPanelContentBody.vue";
import AccessPointLoadingSpinner from "~/components/mobileKey/AccessPointLoadingSpinner.vue";

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

const { getStatus } = useAccessPoints();

const isOpenSlideover = ref(false);
const isOpenPopup = ref(false);

const isLoading = ref(false);
const isVerified = ref(false);

//State
const errorMessage = ref("");
const errorKey = ref("");
const successKey = ref("");

//Status
const accessPointStatus = ref({});
watch([isOpenSlideover, isOpenPopup], async ([slideoverOpen, popupOpen]) => {
  if (slideoverOpen || popupOpen) {
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

    accessPointStatus.value = response.success ? response.data : {};
  } catch (e) {
    console.error("Error fetching access point status:", e);
    accessPointStatus.value = {};
  } finally {
    resetState();
    isLoading.value = false;
  }
}

//actions
function resetState() {
  errorKey.value = "";
  successKey.value = "";

  errorMessage.value = "";
}
function onCloseDialog() {
  isOpenSlideover.value = false;
  isOpenPopup.value = false;

  isLoading.value = false;

  resetState();
  emit("closed");
}
</script>

<style scoped></style>
