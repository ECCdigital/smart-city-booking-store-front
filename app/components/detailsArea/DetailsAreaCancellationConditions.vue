<template>
  <details
    v-if="cancellationRefundTiers.length > 0"
    class="bg-gray-200 dark:bg-gray-700 rounded-md p-3 group"
  >
    <summary
      class="font-bold list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span>{{ $t("bookableDetail.cancellationTitleShort") }}</span>
      <UIcon
        name="i-lucide-chevron-down"
        size="18"
        class="shrink-0 text-gray-600 dark:text-gray-300 group-open:rotate-180 transition-transform"
        aria-hidden="true"
      />
    </summary>

    <CancellationRefundTierList
      class="mt-3 text-gray-700 dark:text-gray-200"
      :tiers="cancellationRefundTiers"
      row-class="bg-white/70 dark:bg-gray-800/70"
    />
  </details>
</template>
<script setup>
import { computed } from "vue";
import CancellationRefundTierList from "~/components/CancellationRefundTierList.vue";
import { sortedRefundTiers } from "~/utils/cancellationRefundTiers.js";

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

// The tiers are the tenant's: a bookable carries them itself, an event on
// each of its tickets, all alike.
const cancellationRefundTiers = computed(() => {
  const source = props.isEvent
    ? props.item?.tickets?.find((ticket) =>
        Array.isArray(ticket?.cancellationRefundTiers),
      )
    : props.item;
  return sortedRefundTiers(source?.cancellationRefundTiers);
});
</script>
<style scoped></style>
