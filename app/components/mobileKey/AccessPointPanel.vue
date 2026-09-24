<template>
  <div class="lg:hidden">
    <USlideover
      v-model:open="isOpenSlideover"
      side="bottom"
      inset
      :title="accessPointLabel"
      description="Informationen und Status des Schließsystems"
      :ui="{
        wrapper: 'bg-black/60',
        content: 'w-[90vw] mx-auto rounded-t-2xl shadow-lg',
      }"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #header>
        <DialogTitle class="sr-only">
          {{ accessPointLabel }}
        </DialogTitle>

        <DialogDescription class="sr-only">
          Informationen und Status des Schließsystems
        </DialogDescription>

        <!--
          The header already held the way out; it now holds the door as well,
          in one line, so the stage below it does not have to spend 188 px
          saying which door this is.
        -->
        <div class="flex w-full items-center gap-2">
          <AccessPointCard
            compact
            :access-point="accessPoint"
            :booking="booking"
            :is-open="isOpen"
          />
          <UButton
            trailing-icon="i-lucide-x"
            variant="ghost"
            color="primary"
            size="md"
            class="shrink-0"
            @click="onCloseDialog"
          />
        </div>
      </template>
      <template #body>
        <div class="pb-5 h-[60vh]">
          <!--
            A payload that does not say what this door demands, or what it can
            do, is no door to stand in front of - the panel says so instead of
            offering a button nobody asked for a proof at.
          -->
          <div v-if="!door" class="space-y-5">
            <AccessPointErrorScreen
              :kind="ACCESS_ERRORS.GENERIC"
              :access-point-label="accessPointLabel"
              :booking="booking"
              :tenant-id="tenantId"
            />
            <UButton
              variant="ghost"
              block
              class="cursor-pointer"
              @click="onCloseDialog"
            >
              Abbrechen
            </UButton>
          </div>

          <AccessPointOpenFlow
            v-else
            :tenant-id="tenantId"
            :access-point="door"
            :booking="booking"
            @status="onStatus"
          >
            <template #exit>
              <UButton
                variant="ghost"
                block
                class="cursor-pointer"
                @click="onCloseDialog"
              >
                Schließen
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
      :title="accessPointLabel"
      description="Informationen und Status des Schließsystems"
    >
      <AccessPointPanelButton :deny-access="denyAccess" />
      <template #content>
        <div class="h-full overflow-y-auto p-5">
          <DialogTitle class="sr-only">
            {{ accessPointLabel }}
          </DialogTitle>
          <DialogDescription class="sr-only">
            Informationen und Status des Schließsystems
          </DialogDescription>

          <!-- the same header as on the phone: the door beside the way out -->
          <div class="flex w-full items-center gap-2">
            <AccessPointCard
              compact
              :access-point="accessPoint"
              :booking="booking"
              :is-open="isOpen"
            />
            <UButton
              trailing-icon="i-lucide-x"
              variant="ghost"
              color="primary"
              size="md"
              class="shrink-0"
              @click="onCloseDialog"
            />
          </div>

          <!--
            A payload that does not say what this door demands, or what it can
            do, is no door to stand in front of - the panel says so instead of
            offering a button nobody asked for a proof at.
          -->
          <div v-if="!door" class="space-y-5">
            <AccessPointErrorScreen
              :kind="ACCESS_ERRORS.GENERIC"
              :access-point-label="accessPointLabel"
              :booking="booking"
              :tenant-id="tenantId"
            />
            <UButton
              variant="ghost"
              block
              class="cursor-pointer"
              @click="onCloseDialog"
            >
              Abbrechen
            </UButton>
          </div>

          <AccessPointOpenFlow
            v-else
            :tenant-id="tenantId"
            :access-point="door"
            :booking="booking"
            @status="onStatus"
          >
            <template #exit>
              <UButton
                variant="ghost"
                block
                class="cursor-pointer"
                @click="onCloseDialog"
              >
                Schließen
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

import AccessPointCard from "~/components/mobileKey/AccessPointCard.vue";
import AccessPointErrorScreen from "~/components/mobileKey/AccessPointErrorScreen.vue";
import AccessPointOpenFlow from "~/components/mobileKey/AccessPointOpenFlow.vue";
import AccessPointPanelButton from "~/components/mobileKey/AccessPointPanelButton.vue";
import {
  ACCESS_ERRORS,
  isUnlocked,
  readAccessPoint,
} from "~/utils/accessOpenFlow.js";

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

/**
 * The payload is read once, before the flow ever sees the door - and it may
 * come back `null`, where the server did not say what this door demands. The
 * panel then stands open on an error rather than on an open-button nobody
 * asked for a proof at.
 */
const door = computed(() => readAccessPoint(props.accessPoint));

/**
 * Read off the payload rather than off `door`, which is `null` in exactly the
 * case the name is needed most: a refused door still has a label, and the
 * error screen says which door it is talking about or it says nothing useful.
 */
const accessPointLabel = computed(() => props.accessPoint.label || "Der Zugang");

/**
 * The last status the flow reported. It was passed straight on before; the
 * panel now keeps it as well, because the door in its header has to say lock
 * or unlock - the reading the flow used to make for the card it carried.
 */
const status = ref(undefined);

function onStatus(next) {
  status.value = next;
  emit("status", next);
}

/**
 * Read with `isUnlocked` rather than off the stage, so the door in the header
 * and the door in the list row behind it answer to the same rule - `open`
 * ahead of `locked`, as ticket 07 settled it.
 */
const isOpen = computed(() => isUnlocked(status.value) === true);

function onCloseDialog() {
  isOpenSlideover.value = false;
  isOpenPopup.value = false;
}
</script>

<style scoped></style>
