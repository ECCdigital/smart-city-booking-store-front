<template>
  <div class="lg:hidden">
    <USlideover
      v-model:open="isOpenSlideover"
      side="bottom"
      inset
      :title="door.label"
      description="Informationen und Status des Schließsystems"
      :ui="{
        wrapper: 'bg-black/60',
        content: 'w-[90vw] mx-auto rounded-t-2xl shadow-lg',
      }"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #header>
        <DialogTitle class="sr-only">
          {{ door.label }}
        </DialogTitle>

        <DialogDescription class="sr-only">
          Informationen und Status des Schließsystems
        </DialogDescription>

        <div class="flex w-full justify-end">
          <UButton
            trailing-icon="i-lucide-x"
            variant="ghost"
            color="primary"
            size="md"
            @click="onCloseDialog"
          />
        </div>
      </template>
      <template #body>
        <div class="pb-5 h-[60vh]">
          <AccessPointOpenFlow
            :tenant-id="tenantId"
            :access-point="door"
            :booking="booking"
            @status="(status) => emit('status', status)"
          >
            <template #exit="{ stage }">
              <UButton
                variant="ghost"
                block
                class="cursor-pointer"
                @click="onCloseDialog"
              >
                {{ exitLabel(stage) }}
              </UButton>
            </template>
          </AccessPointOpenFlow>
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
      :title="door.label"
      description="Informationen und Status des Schließsystems"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #content>
        <div class="h-full overflow-y-auto p-5">
          <DialogTitle class="sr-only">
            {{ door.label }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Informationen und Status des Schließsystems
          </DialogDescription>

          <div class="flex w-full justify-end">
            <UButton
              trailing-icon="i-lucide-x"
              variant="ghost"
              color="primary"
              size="md"
              @click="onCloseDialog"
            />
          </div>

          <AccessPointOpenFlow
            :tenant-id="tenantId"
            :access-point="door"
            :booking="booking"
            @status="(status) => emit('status', status)"
          >
            <template #exit="{ stage }">
              <UButton
                variant="ghost"
                block
                class="cursor-pointer"
                @click="onCloseDialog"
              >
                {{ exitLabel(stage) }}
              </UButton>
            </template>
          </AccessPointOpenFlow>
        </div>
      </template>
    </UModal>
  </div>
</template>
<script setup>
/**
 * The panel is the shell around the shared flow, nothing more: the trigger, the
 * slideover on the phone, the modal on the desktop, the X - and the way out of
 * this context, which is the one thing the flow leaves to whoever put it here.
 *
 * The status it hears about goes straight on to the list; opening, closing and
 * every decision in between belong to `AccessPointOpenFlow`.
 */
import { DialogTitle, DialogDescription } from "reka-ui";

import AccessPointOpenFlow from "~/components/mobileKey/AccessPointOpenFlow.vue";
import AccessPointPanelButton from "~/components/mobileKey/AccessPointPanelButton.vue";
import { readAccessPoint } from "~/utils/accessOpenFlow.js";

const props = defineProps({
  /** Always explicit, never read off the access point (#21). */
  tenantId: {
    type: String,
    required: true,
  },
  accessPoint: {
    type: Object,
    required: true,
  },
  /** The booking this key belongs to, resolved - the list has it in hand. */
  booking: {
    type: Object,
    required: true,
  },
  denyAccess: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["status"]);

const isOpenSlideover = ref(false);
const isOpenPopup = ref(false);

/** The transitional defaults land once, before the flow ever sees the door. */
const door = computed(() => readAccessPoint(props.accessPoint));

/** The result stages are done with; everything before them can be abandoned. */
const exitLabel = (stage) =>
  ["opened", "closed"].includes(stage) ? "Fertig" : "Abbrechen";

function onCloseDialog() {
  isOpenSlideover.value = false;
  isOpenPopup.value = false;
}
</script>

<style scoped></style>
