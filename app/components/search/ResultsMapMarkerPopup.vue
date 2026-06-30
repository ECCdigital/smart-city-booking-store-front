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
    <UCarousel
      :items="group.bookables"
      fade
      dots
      arrows
      :loop="true"
      :prev="{ variant: 'soft', color: 'primary' }"
      :next="{ variant: 'soft', color: 'primary' }"
      indicators
      :ui="{
        controls:
          'absolute inset-y-0 left-0 right-0 flex items-center justify-between pointer-events-none',
        prev: 'pointer-events-auto translate-x-12',
        next: 'pointer-events-auto -translate-x-12',
        dots: 'absolute left-1/2 -translate-x-1/2 bottom-2',
        dot: 'w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-600',
      }"
      class="w-[300px] mx-auto pb-5 hidden md:flex"
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
</script>

<style>
.leaflet-popup-content-wrapper {
  /*background: transparent !important;*/
  /*box-shadow: none !important;*/
  padding: 5px !important;
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
