<template>
  <div
    v-if="help"
    class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
  >
    <button
      class="flex items-center justify-between w-full px-4 py-3"
      @click="isOpen = !isOpen"
    >
      <div class="flex items-center gap-3">
        <UIcon
          name="i-lucide-life-buoy"
          class="size-10 text-red-500 dark:text-red-400"
        />
        <div class="text-left">
          <p class="font-semibold text-gray-900 dark:text-white text-sm">
            {{
              help.accessPoint
                ? $t("mobileKey.compartmentHelp")
                : $t("mobileKey.bikeBoxHelp")
            }}
          </p>
          <p
            v-if="help.accessPoint"
            class="text-sm text-gray-700 dark:text-gray-300"
            data-test="emergency-help-compartment"
          >
            {{ accessPointTitle(help.accessPoint, t) }}
          </p>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ $t("mobileKey.emergencyContact") }}
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
import { useAccessPoints } from "~/composables/api/useAccessPoints.js";
import { useEmergencyHelp } from "~/composables/useEmergencyHelp.js";
import { readAccessPointsAnswer } from "~/utils/accessOpenFlow.js";
import { accessPointTitle } from "~/utils/accessPointDisplay.js";
import {
  decideEmergencyHelp,
  holdsAssignedCompartment,
} from "~/utils/emergencyHelp.js";
import EmergencyHelpContent from "~/components/mobileKey/EmergencyHelpContent.vue";

const props = defineProps({
  tenantId: { type: String, required: true },
  booking: { type: Object, required: true },
});

const isOpen = ref(false);

// The contact comes from the booking's tenant snapshot. Only a booking
// without one falls back to the public tenant, which is loaded for it then.
const { tenant, fetchCustomerServiceInfo } = useEmergencyHelp(
  toRef(props, "tenantId"),
  null,
  toRef(props, "booking"),
);
const { t } = useI18n();
const { getAccessPoints } = useAccessPoints();

await fetchCustomerServiceInfo();

// A Fach the platform assigned (Open Locker) is named and confirmed by the
// per-booking projection alone - the stored booking knows no Anlage name, and
// the projection is read fresh, so a Fach changed meanwhile shows as it is.
// Without such a Fach nothing is loaded; a read that fails leaves the help
// as the stored booking has it.
const accessPoints = ref([]);
if (holdsAssignedCompartment(props.booking)) {
  try {
    accessPoints.value = readAccessPointsAnswer(
      await getAccessPoints(props.tenantId, props.booking.id),
    ).points;
  } catch {
    accessPoints.value = [];
  }
}

/** Nothing to show - no confirmed compartment with a contact - means no accordion. */
const help = computed(() =>
  decideEmergencyHelp(tenant.value, props.booking, accessPoints.value),
);
</script>
