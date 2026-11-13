<template>
<div>
  <!-- The sheet lets touches through to the map, so the map can still be
       moved while it is open; a tap on the map closes it (ResultsMap). -->
  <!-- One Item Per Pin-->
  <Transition name="bottom-up" mode="out-in">
    <div
        v-if="showCurrentBookable && currentBookable"
        class="pointer-events-none fixed inset-0 z-[1000] flex items-end justify-center md:hidden"
    >
      <div
          class="pointer-events-auto mb-4 w-[92%] max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
          @click.stop="emit('openDetails',currentBookable, true)"
      >
        <ResultCard
            :item="currentBookable.item"
            :is-not-bookable="!currentBookable.isBookable"
            :calculated-price="currentBookable.calculatedPrice"
            entry-page-mode
            map-detail-mode
        />
      </div>
    </div>
  </Transition>

  <!-- Multiple Items Per Pin -->
  <Transition name="bottom-up" mode="out-in">
    <div
        v-if="showCurrentGroup && currentGroup"
        class="pointer-events-none fixed inset-0 z-[1000] flex items-end justify-center md:hidden"
    >
      <div
          class="pointer-events-auto mb-4 w-[92%] max-w-md overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-2xl"
          @click.stop
      >
        <UCarousel
            :items="currentGroup.bookables"
            fade
            dots
            arrows
            :loop="true"
            :prev="{ variant: 'soft', color: 'primary' }"
            :next="{ variant: 'soft', color: 'primary' }"
            indicators
            :ui="{
                controls:
                  'absolute bottom-6 left-0 right-0 flex justify-between px-4 pointer-events-none',
                prev: 'pointer-events-auto',
                next: 'pointer-events-auto',
                dots: 'absolute left-1/2 -translate-x-1/2 bottom-0',
                dot: 'w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600',
              }"
            class=""
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
      </div>
    </div>
  </Transition>

</div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";

defineProps({
  currentBookable: {
    type: Object,
    required: false,
    default: () => {},
  },
  currentGroup: {
    type: Object,
    required: false,
    default: () => {},
  },
  showCurrentBookable: {
    type: Boolean,
    required: true,
  },
  showCurrentGroup: {
    type: Boolean,
    required: true,
  },
});

const emit = defineEmits(["openDetails"]);
</script>


<style>
.bottom-up-enter-active {
  transition: all 0.3s ease-out;
}
.bottom-up-leave-active {
  transition: all 0.3s ease-in;
}
.bottom-up-enter-from,
.bottom-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}
</style>