<template>
  <div class="details-availability-compact">
    <h3 class="text-base font-bold">{{ $t("detailsAvailability.title") }}</h3>

    <UAlert
      v-if="requiresTimeSelection && !hasValidPeriod"
      :title="hintText"
      icon="i-lucide-info"
      variant="ghost"
      class="p-1 text-primary w-full mt-1 mb-1.5 text-xs flex items-center"
    />

    <UAlert
      v-else-if="!requiresTimeSelection"
      :title="$t('detailsAvailability.noTimeSelection')"
      icon="i-lucide-info"
      variant="ghost"
      class="p-1 text-primary w-full mt-1 mb-1.5 text-xs items-center"
    />

    <InputDateTimePeriod
      v-if="isScheduleRelated"
      compact
      :time-period="timePeriod"
      class="border dark:border-gray-600 rounded-md mt-1 mb-2 w-full"
      @select-date="onPeriodSelected"
      @remove-date="onPeriodCleared"
    />

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
import InputDateTimePeriod from "~/components/inputs/InputDateTimePeriod.vue";
import InputTimePeriodSlots from "~/components/checkout/InputTimePeriodSlots.vue";
import InputWeekSelection from "~/components/checkout/InputWeekSelection.vue";
import InputMonthSelection from "~/components/checkout/InputMonthSelection.vue";
import InputBlockPeriodSelection from "~/components/checkout/InputBlockPeriodSelection.vue";
import { useBookableBookingMode } from "~/composables/useBookableBookingMode";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  timePeriod: {
    type: Object,
    default: () => ({ start: null, end: null }),
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
