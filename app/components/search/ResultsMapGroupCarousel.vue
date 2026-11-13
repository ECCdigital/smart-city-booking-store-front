<template>
  <div>
    <div class="flex items-center justify-end gap-2 pb-2 pl-1">
      <div class="flex shrink-0 items-center gap-2">
        <span
          class="text-sm font-semibold tabular-nums"
          aria-live="polite"
          :aria-label="
            $t('results.offerPosition', {
              n: activeIndex + 1,
              total: group.bookables.length,
            })
          "
        >
          {{ activeIndex + 1 }} / {{ group.bookables.length }}
        </span>
        <UButtonGroup size="sm">
          <UButton
            icon="i-lucide-chevron-left"
            color="neutral"
            variant="outline"
            :aria-label="$t('results.previousOffer')"
            @click="carouselRef?.emblaApi?.scrollPrev()"
          />
          <UButton
            icon="i-lucide-chevron-right"
            color="neutral"
            variant="outline"
            :aria-label="$t('results.nextOffer')"
            @click="carouselRef?.emblaApi?.scrollNext()"
          />
        </UButtonGroup>
      </div>
    </div>

    <!-- auto-height: the viewport follows the active card instead of the
         tallest one, so a card with a one-line address leaves no gap. -->
    <UCarousel
      ref="carouselRef"
      :items="group.bookables"
      fade
      auto-height
      :loop="true"
      class="w-full h-auto pb-0"
      @select="onSelect"
    >
      <template #default="{ item }">
        <div class="flex justify-center w-full mb-0">
          <ResultCard
            :item="item.item"
            :is-not-bookable="!item.isBookable"
            :calculated-price="item.calculatedPrice"
            map-detail-mode
            class="w-full shadow-none"
            @click="emit('openDetails', item, true)"
          />
        </div>
      </template>
    </UCarousel>
  </div>
</template>
<script setup>
// The Offers of one pin, one card at a time: the map popup on large screens
// and the bottom sheet on small ones show the same carousel.
import ResultCard from "~/components/search/ResultCard.vue";

defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["openDetails"]);

const carouselRef = ref(null);

const activeIndex = ref(0);

function onSelect(index) {
  activeIndex.value = index;
}
</script>
