<template>
  <LPopup
    v-if="group.bookables.length > 1"
    :options="{
      minWidth: 320,
      maxWidth: 320,
      className: 'results-map-popup',
    }"
    class="justify-center bg-transparent hidden md:flex"
    @remove="emit('closeGroup')"
  >
    <ResultsMapGroupCarousel
      :group="group"
      class="w-[300px] mx-auto hidden md:block"
      @open-details="(item, onMobile) => emit('openDetails', item, onMobile)"
    />
  </LPopup>
</template>
<script setup>
import ResultsMapGroupCarousel from "~/components/search/ResultsMapGroupCarousel.vue";

defineProps({
  group: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["openDetails", "closeGroup"]);
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

/* Leaflet opens the popup on the phone too, where the bottom sheet shows the
   Offers; its empty wrapper stayed behind as a white dot on the pin. */
@media (max-width: 767px) {
  .results-map-popup {
    display: none !important;
  }
}
</style>
