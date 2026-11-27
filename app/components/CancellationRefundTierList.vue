<template>
  <div v-if="sortedTiers.length > 0" class="text-sm">
    <p class="mb-3">
      {{ $t("bookableDetail.cancellationHint") }}
    </p>

    <ul class="space-y-2">
      <li
        v-for="tier in sortedTiers"
        :key="`${tier.hoursBeforeStart}-${tier.refundPercentage}`"
        class="rounded-md px-3 py-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-0.5"
        :class="[rowClass, compact ? 'text-xs' : 'text-xs md:text-sm']"
      >
        <!-- The separator keeps deadline and refund apart for screen readers. -->
        <span
          >{{ formatTierDeadline($t, tier.hoursBeforeStart)
          }}<span class="sr-only">: </span></span
        >
        <span class="font-semibold text-right">
          {{ tier.refundPercentage }} % {{ $t("bookableDetail.refund") }}
        </span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from "vue";
import {
  formatTierDeadline,
  sortedRefundTiers,
} from "~/utils/cancellationRefundTiers.js";

// The tenant's refund scale as the storefront shows it everywhere: on the
// detail page, in the checkout's price card and in its summary. The tiers
// are small on small screens, and always where `compact`.
const props = defineProps({
  tiers: {
    type: Array,
    default: () => [],
  },
  /** The rows' background, to stand out from the surface around them. */
  rowClass: {
    type: String,
    default: "bg-gray-100 dark:bg-gray-800",
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const sortedTiers = computed(() => sortedRefundTiers(props.tiers));
</script>
