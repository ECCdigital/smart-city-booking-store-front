<template>
  <details
    v-if="hasCancellationRefundTiers"
    class="bg-gray-200 dark:bg-gray-700 rounded-md p-3 group"
  >
    <summary
      class="font-bold cursor-pointer list-none flex items-center justify-between gap-3"
    >
      <span>Stornierungsbedingungen</span>
      <span
        class="text-sm font-normal text-gray-600 dark:text-gray-300 group-open:rotate-180 transition-transform"
      >
        ▼
      </span>
    </summary>

    <div class="mt-3 text-sm text-gray-700 dark:text-gray-200">
      <p class="mb-3">
        Je früher storniert wird, desto höher ist die Rückerstattung.
      </p>

      <ul class="space-y-2">
        <li
          v-for="tier in normalizedCancellationRefundTiers"
          :key="`${tier.daysBeforeStart}-${tier.refundPercentage}`"
          class="rounded-md bg-white/70 dark:bg-gray-800/70 px-3 py-2 flex items-center justify-between gap-4"
        >
          <span>{{ formatDaysBeforeStart(tier.daysBeforeStart) }}</span>
          <span class="font-semibold text-right"
            >{{ tier.refundPercentage }} % <br class="block md:hidden" />
            Rückerstattung</span
          >
        </li>
      </ul>
    </div>
  </details>
</template>
<script setup>
import { computed } from "vue";

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

const normalizedCancellationRefundTiers = computed(() => {
  const tiers = Array.isArray(props.item?.cancellationRefundTiers)
    ? props.item.cancellationRefundTiers
    : [];

  return [...tiers]
    .filter(
      (tier) =>
        Number.isFinite(tier?.daysBeforeStart) &&
        Number.isFinite(tier?.refundPercentage),
    )
    .sort((left, right) => right.daysBeforeStart - left.daysBeforeStart);
});

const hasCancellationRefundTiers = computed(
  () => normalizedCancellationRefundTiers.value.length > 0,
);

function formatDaysBeforeStart(daysBeforeStart) {
  if (daysBeforeStart === 0) {
    return "Am Starttag";
  }

  if (daysBeforeStart === 1) {
    return "Bis 1 Tag vor Beginn";
  }

  return `Bis ${daysBeforeStart} Tage vor Beginn`;
}
</script>
<style scoped></style>
