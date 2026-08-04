<template>
  <div class="details-availability-compact">
    <h3 class="text-base font-bold">
      {{ $t("detailsAvailability.title") }}
    </h3>

    <!-- Hint for group bookings -->
    <div
      v-if="bookable.groupBookingAllowed"
      class="my-2 flex flex-col rounded-xl border border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800 dark:bg-primary-950/30 sm:flex-row sm:items-center sm:justify-between"
    >
      <div class="flex items-start gap-3">
        <UIcon
          name="i-lucide-repeat"
          class="mt-0.5 text-primary-600 dark:text-primary-400"
          size="20"
        />
        <div>
          <p class="font-semibold text-gray-900 dark:text-white">
            {{ $t("detailsAvailability.groupBookingTitle") }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-300">
            {{ $t("detailsAvailability.groupBookingDescription") }}
          </p>
        </div>
      </div>
    </div>

    <UAlert
      v-if="requiresTimeSelection && !hasValidPeriod"
      :title="hintText"
      icon="i-lucide-info"
      variant="ghost"
      class="p-1 text-info w-full my-2 text-sm flex items-center"
    />

    <UAlert
      v-else-if="!requiresTimeSelection"
      :title="$t('detailsAvailability.noTimeSelection')"
      icon="i-lucide-info"
      variant="ghost"
      class="p-1 text-info w-full my-2 text-sm items-center"
    />

    <!--
    <div v-if="isScheduleRelated" class="relative mt-1 mb-2 w-full">
      <InputDateTimePeriod
        :time-period="timePeriod"
        :variant="isMdUp ? 'bar' : 'modal'"
        compact
        class="border dark:border-gray-600 rounded-md w-full"
        @select-date="onPeriodSelected"
        @remove-date="onPeriodCleared"
      />
      <div
        ref="datetimePanelHost"
        class="absolute left-0 right-0 top-full z-50"
      />
    </div>
    -->
    <div v-if="isScheduleRelated" class="mt-1 mb-2">
      <InputFreeTimeSelection
        compact
        :model-value="timePeriod"
        :tenant-id="bookable.tenantId"
        :bookable-id="bookable.id"
        @update:model-value="onPeriodSelected"
        @remove-time-selection="onPeriodCleared"
      />
    </div>

    <div v-else-if="isTimePeriodRelated" class="mt-1 mb-2">
      <InputTimePeriodSlots
        compact
        :model-value="timePeriod"
        :time-periods="bookableTimePeriods"
        :tenant-id="bookable.tenantId"
        :bookable-id="bookable.id"
        @update:model-value="onPeriodSelected"
      />
    </div>

    <div v-else-if="isLongRangeWeek" class="mt-1 mb-2">
      <InputWeekSelection
        compact
        :model-value="timePeriod"
        :tenant-id="bookable.tenantId"
        :bookable-id="bookable.id"
        @update:model-value="onPeriodSelected"
      />
    </div>

    <div v-else-if="isLongRangeMonth" class="mt-1 mb-2">
      <InputMonthSelection
        compact
        :model-value="timePeriod"
        :tenant-id="bookable.tenantId"
        :bookable-id="bookable.id"
        @update:model-value="onPeriodSelected"
      />
    </div>

    <div v-else-if="isBlockPeriodRelated" class="mt-1 mb-2">
      <InputBlockPeriodSelection
        compact
        :model-value="timePeriod"
        :tenant-id="bookable.tenantId"
        :bookable-id="bookable.id"
        @update:model-value="onPeriodSelected"
      />
    </div>
  </div>
</template>

<script setup>
import InputTimePeriodSlots from "~/components/checkout/InputTimePeriodSlots.vue";
import InputWeekSelection from "~/components/checkout/InputWeekSelection.vue";
import InputMonthSelection from "~/components/checkout/InputMonthSelection.vue";
import InputBlockPeriodSelection from "~/components/checkout/InputBlockPeriodSelection.vue";
import { useBookableBookingMode } from "~/composables/useBookableBookingMode.ts";
import InputFreeTimeSelection from "~/components/checkout/InputFreeTimeSelection.vue";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  timePeriod: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  items: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["period-selected", "period-cleared"]);

const { t } = useI18n();

const {
  requiresTimeSelection,
  isScheduleRelated,
  isTimePeriodRelated,
  isLongRangeWeek,
  isLongRangeMonth,
  isBlockPeriodRelated,
  mode,
} = useBookableBookingMode(() => props.bookable);

//const isMdUp = useMediaQuery("(min-width: 1024px)");

const datetimePanelHost = ref(null);
provide("searchBarDatetimePanelHost", datetimePanelHost);

const bookableTimePeriods = computed(() => props.bookable?.timePeriods || []);

const hasValidPeriod = computed(() => {
  const { start, end } = props.timePeriod || {};
  return start != null && end != null && end > start;
});

const hintText = computed(() => {
  switch (mode.value) {
    case "schedule":
      return t("detailsAvailability.scheduleHint");
    case "timePeriod":
      return t("detailsAvailability.timePeriodHint");
    case "longRangeWeek":
      return t("detailsAvailability.longRangeWeekHint");
    case "longRangeMonth":
      return t("detailsAvailability.longRangeMonthHint");
    case "blockPeriod":
      return t("detailsAvailability.blockPeriodHint");
    default:
      return t("detailsAvailability.selectPeriodHint");
  }
});

function onPeriodSelected(period) {
  if (!period?.start || !period?.end || period.end <= period.start) return;
  emit("period-selected", period);
}

function onPeriodCleared() {
  emit("period-cleared");
}
</script>
