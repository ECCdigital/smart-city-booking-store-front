<template>
  <div
    v-if="help"
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
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
      class="border-t border-gray-200 dark:border-gray-700 p-4"
    >
      <EmergencyHelpContent
        :service-info="help.serviceInfo"
        :process-id="help.processId"
      />
    </div>
  </div>
</template>

<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import { decideEmergencyHelp } from "~/utils/emergencyHelp.js";
import EmergencyHelpContent from "~/components/mobileKey/EmergencyHelpContent.vue";

const props = defineProps({
  tenantId: { type: String, required: true },
  booking: { type: Object, required: true },
});

const isOpen = ref(false);

// The contact comes from the public tenant projection; the store is empty on
// a direct visit to the booking page, so make sure it is loaded first.
const tenantStore = useTenantStore();
await tenantStore.fetchTenants();

/** Nothing to show - no confirmed compartment with a contact - means no accordion. */
const help = computed(() =>
  decideEmergencyHelp(tenantStore.getTenantById(props.tenantId), props.booking),
);
</script>
