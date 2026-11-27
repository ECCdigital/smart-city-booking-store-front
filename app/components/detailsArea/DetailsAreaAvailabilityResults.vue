<template>
  <div
    v-if="showAvailabilityResult"
    class="flex flex-wrap justify-between items-center gap-x-3 gap-y-2 dark:bg-gray-700 rounded-lg shadow-sm px-4 py-2 border border-gray-200 dark:border-gray-500 min-w-[250px]"
  >
    <!-- The title may shrink and break inside long words; once it would get
         narrower than 7rem, price and button wrap onto their own line. -->
    <div
      class="flex-1 min-w-28 font-semibold line-clamp-2 break-words hyphens-auto text-sm md:text-base"
    >
      {{ item?.title }}
    </div>
    <div
      class="flex flex-wrap items-center justify-end gap-2 ml-auto text-sm md:text-base"
    >
      <!-- Capped width so a long unit such as "pro Stunde (inkl. MwSt.)"
           wraps below the price instead of running into the title. -->
      <BookablePriceDisplay
        v-if="items.length > 0"
        :bookable="items[0].item"
        :calculated-price="items[0].calculatedPrice"
        :duration="timePeriodDuration"
        class="font-semibold max-w-24 md:max-w-32 shrink-0 text-xs md:text-base"
      />
      <div class="content-center">
        <UButton
          v-if="isBookableAndMatch"
          :label="$t('bookableDetail.book')"
          class="justify-center px-2 md:px-5"
          style="color: var(--ui-primary-contrast)"
          @click="goToCheckout()"
        />
        <UButton
          v-else-if="isAvailabilityUnchecked"
          :label="$t('bookableDetail.availabilityUnchecked')"
          color="neutral"
          variant="soft"
          class="justify-center px-2 md:px-5"
        />
        <UButton
          v-else
          :label="$t('bookableDetail.unavailable')"
          color="neutral"
          variant="soft"
          class="justify-center px-2 md:px-5"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  items: {
    type: Array,
    default: () => [],
  },
  timePeriodDuration: {
    type: String,
    default: "",
  },
});

const {
  isBookableAndMatch,
  isAvailabilityUnchecked,
  showAvailabilityResult,
  goToCheckout,
} = useBookableDetailContent(() => props.item);
</script>

<style scoped></style>
