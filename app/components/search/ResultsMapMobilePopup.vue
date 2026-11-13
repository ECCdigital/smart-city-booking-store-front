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
          class="pointer-events-auto mb-4 w-[92%] max-w-md overflow-hidden rounded-2xl bg-(--ui-bg-elevated) p-[5px] shadow-2xl"
          @click.stop
      >
        <ResultsMapGroupCarousel
            :group="currentGroup"
            @open-details="(item, onMobile) => emit('openDetails', item, onMobile)"
        />
      </div>
    </div>
  </Transition>

</div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";
import ResultsMapGroupCarousel from "~/components/search/ResultsMapGroupCarousel.vue";

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