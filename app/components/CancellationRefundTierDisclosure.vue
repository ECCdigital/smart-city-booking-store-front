<template>
  <details
    v-if="tiers.length > 0"
    class="group"
    @toggle="isOpen = $event.target.open"
  >
    <summary
      class="list-none [&::-webkit-details-marker]:hidden flex items-center justify-between gap-3 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      :class="summaryClass"
    >
      <slot name="summary" :open="isOpen">
        <span>{{ $t("bookableDetail.cancellationTitleShort") }}</span>
        <UIcon
          name="i-lucide-chevron-down"
          size="16"
          class="shrink-0 text-gray-600 dark:text-gray-300 group-open:rotate-180 transition-transform"
          aria-hidden="true"
        />
      </slot>
    </summary>

    <!-- A scale that may outgrow a sticky card scrolls inside it, also by
         keyboard: then it is a named region in the tab order. -->
    <div
      v-bind="
        scrollable
          ? {
              role: 'region',
              tabindex: 0,
              'aria-label': $t('bookableDetail.cancellationTitleShort'),
            }
          : {}
      "
      :class="
        scrollable
          ? 'mt-2 max-h-[35vh] overflow-y-auto rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary'
          : 'mt-3'
      "
    >
      <CancellationRefundTierList
        :tiers="tiers"
        :row-class="rowClass"
        :compact="compact"
      />
    </div>
  </details>
</template>

<script setup>
import { ref } from "vue";
import CancellationRefundTierList from "~/components/CancellationRefundTierList.vue";

// The refund scale behind a native disclosure: keyboard, focus and the
// open state come with <details>; the chevron is decoration only. The slot
// `summary` replaces title and chevron, with `open` to word them by state.
defineProps({
  /** The tenant's refund scale, sorted (`sortedRefundTiers`). */
  tiers: {
    type: Array,
    default: () => [],
  },
  summaryClass: {
    type: String,
    default: "text-sm font-medium text-gray-700 dark:text-gray-200",
  },
  rowClass: {
    type: String,
    default: undefined,
  },
  compact: {
    type: Boolean,
    default: false,
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
});

const isOpen = ref(false);
</script>
