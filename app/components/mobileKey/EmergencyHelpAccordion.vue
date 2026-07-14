<template>
  <div
    v-if="serviceInfo && ifbsLockerInfo?.isConfirmed"
    class="bg-surface-raised rounded-lg border border-surface-border"
  >
    <button
      class="flex items-center justify-between w-full px-4 py-3 cursor-pointer"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-life-buoy"
          class="size-10 text-red-500 dark:text-red-400"
        />
        <div class="text-left">
          <p class="font-semibold text-gray-900 dark:text-white text-sm">
            Hilfe bei Problemen mit der Fahrradbox
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Notfallkontakt & Vorgehen bei Störungen
          </p>
        </div>
      </div>
      <UIcon
        :name="isOpen ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
        class="size-5 text-gray-400 dark:text-gray-500 transition-transform"
      />
    </button>

    <div
      v-if="isOpen"
      class="border-t border-surface-border p-4"
    >
      <EmergencyHelpContent
        :service-info="serviceInfo"
        :process-id="ifbsLockerInfo.processId"
      />
    </div>
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

const isOpen = ref(false);

const { serviceInfo, ifbsLockerInfo, fetchCustomerServiceInfo } =
  useEmergencyHelp(
    toRef(props, "tenantId"),
    toRef(props, "bookingId"),
    toRef(props, "lockerInfo")
  );

await fetchCustomerServiceInfo();
</script>
