<template>
  <CancellationRefundTierDisclosure
    class="bg-gray-200 dark:bg-gray-700 rounded-md p-3 text-gray-700 dark:text-gray-200"
    summary-class="font-bold text-gray-900 dark:text-white"
    row-class="bg-white/70 dark:bg-gray-800/70"
    :tiers="cancellationRefundTiers"
  />
</template>
<script setup>
import { computed } from "vue";
import CancellationRefundTierDisclosure from "~/components/CancellationRefundTierDisclosure.vue";
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
