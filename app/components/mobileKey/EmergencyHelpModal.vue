<template>
  <div v-if="serviceInfo && ifbsLockerInfo?.isConfirmed">
    <UModal v-model:open="showModal">
      <UTooltip text="Notfallhilfe">
        <UButton
            icon="i-lucide-life-buoy"
            variant="soft"
            color="error"
            class="rounded-3xl cursor-pointer"
        />
      </UTooltip>
      <template #content>
        <div class="p-5">
          <div class="flex items-center gap-3 mb-4">
            <UIcon
                name="i-lucide-life-buoy"
                class="size-8 text-red-500 dark:text-red-400"
            />
            <div>
              <p class="font-semibold text-gray-900 dark:text-white">
                Hilfe bei Problemen mit der Fahrradbox
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Notfallkontakt & Vorgehen bei Störungen
              </p>
            </div>
          </div>
          <USeparator class="mb-4" />
          <EmergencyHelpContent
              :service-info="serviceInfo"
              :process-id="ifbsLockerInfo.processId"
          />
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup>
import { useEmergencyHelp } from "~/composables/useEmergencyHelp.js";
import EmergencyHelpContent from "~/components/mobileKey/EmergencyHelpContent.vue";

const props = defineProps({
  tenantId: { type: String, required: true },
  bookingId: { type: String, required: true },
  lockerInfo: { type: Array, required: true },
});

const showModal = ref(false);

const { serviceInfo, ifbsLockerInfo, fetchCustomerServiceInfo } =
    useEmergencyHelp(
        toRef(props, "tenantId"),
        toRef(props, "bookingId"),
        toRef(props, "lockerInfo"),
    );

await fetchCustomerServiceInfo();
</script>