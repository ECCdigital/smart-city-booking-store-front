<template>
  <LPopup
    v-if="group.bookables.length > 1"
    :options="{
      minWidth: 320,
      maxWidth: 320,
    }"
    class="justify-center bg-transparent hidden md:flex"
    @remove="emit('closeGroup')"
  >
    <div class="w-[300px] mx-auto hidden md:block">
      <UCarousel
        ref="carouselRef"
        :items="group.bookables"
        fade
        arrows
        :loop="true"
        :prev="{ variant: 'soft', color: 'primary' }"
        :next="{ variant: 'soft', color: 'primary' }"
        :ui="{
          controls:
            'absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none',
          prev: 'pointer-events-auto translate-x-12',
          next: 'pointer-events-auto -translate-x-12',
        }"
        class="w-full"
        @select="onSelect"
      >
        <template #default="{ item }">
          <div class="flex justify-center w-full">
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

      <!-- Own dots instead of the carousel's. -->
      <div class="flex items-center justify-center gap-2 pt-3 pb-1 px-4">
        <UIcon
          name="i-lucide-chevron-left"
          class="size-4 shrink-0 text-muted"
          :class="windowStart > 0 ? '' : 'invisible'"
          aria-hidden="true"
        />
        <div
          class="overflow-hidden py-1"
          :style="{ width: `${windowWidth}px` }"
        >
          <div
            role="tablist"
            class="flex items-center gap-2 transition-transform duration-300 ease-out motion-reduce:transition-none"
            :style="{ transform: `translateX(-${windowStart * DOT_STEP}px)` }"
          >
            <button
              v-for="(bookable, index) in group.bookables"
              :key="bookable.item.id"
              type="button"
              role="tab"
              :aria-selected="index === activeIndex"
              :aria-label="$t('results.goToOffer', { n: index + 1 })"
              class="size-2 shrink-0 rounded-full cursor-pointer transition-colors"
              :class="
                index === activeIndex
                  ? 'bg-inverted'
                  : 'bg-gray-400 dark:bg-gray-600'
              "
              @click="carouselRef?.emblaApi?.scrollTo(index)"
            />
          </div>
        </div>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 shrink-0 text-muted"
          :class="
            windowStart + DOTS_VISIBLE < group.bookables.length
              ? ''
              : 'invisible'
          "
          aria-hidden="true"
        />
      </div>
    </div>
  </LPopup>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";

const props = defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["openDetails", "closeGroup"]);

const carouselRef = ref(null);

const DOT_STEP = 16;
const DOTS_VISIBLE = 13;
const DOT_EDGE = 1;

const activeIndex = ref(0);
const windowStart = ref(0);

const windowWidth = computed(
  () =>
    Math.min(DOTS_VISIBLE, props.group.bookables.length) * DOT_STEP -
    (DOT_STEP - 8),
);

function onSelect(index) {
  activeIndex.value = index;
  const total = props.group.bookables.length;
  if (total <= DOTS_VISIBLE) {
    windowStart.value = 0;
    return;
  }
  const maxStart = total - DOTS_VISIBLE;
  if (index - DOT_EDGE < windowStart.value) {
    windowStart.value = Math.max(0, index - DOT_EDGE);
  } else if (index + DOT_EDGE > windowStart.value + DOTS_VISIBLE - 1) {
    windowStart.value = Math.min(maxStart, index + DOT_EDGE - DOTS_VISIBLE + 1);
  }
}
</script>

<style>
.leaflet-popup-content-wrapper {
  padding: 5px !important;
  /* Leaflet paints white with dark grey text; the cards inside follow the
     colour mode, so the wrapper does too. */
  background: var(--ui-bg-elevated);
  color: var(--ui-text);
}

.leaflet-popup-content {
  margin: 0 !important;
  width: auto !important;
}
.leaflet-popup-content p {
  margin: 0 !important;
}

.leaflet-popup-tip-container {
  display: none !important;
}

.leaflet-popup-tip {
  display: none !important;
}

.leaflet-popup-close-button {
  display: none !important;
}
</style>
