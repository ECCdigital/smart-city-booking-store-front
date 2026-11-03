<template>
  <details
    v-if="hasCancellationRefundTiers"
    class="bg-gray-200 dark:bg-gray-700 rounded-md p-3 group"
  >
    <summary
      class="font-bold list-none flex items-center justify-between gap-3"
    >
      <span>{{ $t("bookableDetail.cancellationTitleShort") }}</span>
      <span
        class="text-sm font-normal text-gray-600 dark:text-gray-300 group-open:rotate-180 transition-transform"
      >
        ▼
      </span>
    </summary>

    <div class="mt-3 text-sm text-gray-700 dark:text-gray-200">
      <p class="mb-3">
        {{ $t("bookableDetail.cancellationHint") }}
      </p>

      <ul class="space-y-2">
        <li
          v-for="tier in normalizedCancellationRefundTiers"
          :key="`${tier.hoursBeforeStart}-${tier.refundPercentage}`"
          class="rounded-md bg-white/70 dark:bg-gray-800/70 px-3 py-2 flex items-center justify-between gap-4"
        >
          <span>{{ formatDeadline(tier.hoursBeforeStart) }}</span>
          <span class="font-semibold text-right"
            >{{ tier.refundPercentage }} % <br class="block md:hidden" />
            {{ $t("bookableDetail.refund") }}</span
          >
        </li>
      </ul>
    </div>
  </details>
</template>
<script setup>
import { computed } from "vue";
import {
  sortedRefundTiers,
  tierDeadline,
} from "~/utils/cancellationRefundTiers.js";

const { t } = useI18n();

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    required: true,
  },
});

const normalizedCancellationRefundTiers = computed(() =>
  sortedRefundTiers(props.item?.cancellationRefundTiers),
);

const hasCancellationRefundTiers = computed(
  () => normalizedCancellationRefundTiers.value.length > 0,
);

function formatDeadline(hoursBeforeStart) {
  if (hoursBeforeStart === 0) {
    return t("bookableDetail.untilStart");
  }

  const { amount, unit } = tierDeadline(hoursBeforeStart);
  return unit === "days"
    ? t("bookableDetail.untilDaysBefore", { n: amount }, amount)
    : t("bookableDetail.untilHoursBefore", { n: amount }, amount);
}
</script>
<style scoped></style>
