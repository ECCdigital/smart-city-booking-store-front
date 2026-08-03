<template>
  <div
    v-if="showAvailabilityResult"
    class="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm px-4 py-2 border border-gray-200 dark:border-gray-500 min-w-[250px]"
  >
    <div class="font-semibold mr-1 content-center line-clamp-2">
      {{ item?.title }}
    </div>
    <div class="flex justify-end mt-3 md:mt-0 ml-2">
      <BookablePriceDisplay
        v-if="items.length > 0"
        :bookable="items[0].item"
        :calculated-price="items[0].calculatedPrice"
        class="mx-2 font-semibold content-center w-20 md:shrink-0"
      />
      <div class="content-center">
        <UButton
          v-if="isBookable"
          :label="$t('bookableDetail.book')"
          class="justify-center px-5"
          :style="{ color: contrastToPrimary }"
          @click="goToCheckout()"
        />
        <UButton
          v-else
          :label="$t('bookableDetail.unavailable')"
          variant="soft"
          class="justify-center px-5"
          :style="{ color: contrastToPrimary }"
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
});

const {
  item,
  items,
  isBookable,
  showAvailabilityResult,
  contrastToPrimary,
  goToCheckout,
} = useBookableDetailContent(() => props.item);
</script>

<style scoped></style>
