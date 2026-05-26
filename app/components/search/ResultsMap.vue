<template>
  <div style="height: 80vh; width: 70vw">
    <LMap :zoom="zoom" :use-global-leaflet="false" :center="currentCenter">
      <LTileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
        layer-type="base"
        name="Light  OpenStreetMap"
      />

      <div v-for="bookable in bookables" :key="bookable">
        <LMarker
          v-if="hasCoordinates(bookable.item)"
          :lat-lng="getCoordinatesForBookable(bookable.item)"
          @click="openBookableDetails(bookable)"
        >
          <LTooltip :options="{ className: 'clean-tooltip' }">
            <div class="overflow-hidden rounded-2xl shadow-2xl">
              <ResultCard
                :item="bookable.item"
                :is-not-bookable="!bookable.isBookable"
                :calculated-price="bookable.calculatedPrice"
                entry-page-mode
                map-mode
                class="w-[300px] break-normal"
              />
            </div>
          </LTooltip>
        </LMarker>
      </div>
    </LMap>
  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});
const { goToDetailsNewTab } = useRedirection();

const currentCenter = computed(() => {
  const latitude = null;
  const longitude = null;
  const error = null;

  /*if (!navigator.geolocation) {
    error = 'Geolocation wird vom Browser nicht unterstützt.'
    return
  }

  navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude
        longitude = position.coords.longitude
      },
      (err) => {
        error = err.message
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
  )*/

  if (latitude && longitude) {
    return [latitude, longitude];
  }
  return [53.5, 10.0];
});
const zoom = ref(8); //toDo - passenden Zoom-Level wählen

function hasCoordinates(bookable) {
  return (
    !!bookable.location &&
    !!bookable.location?.coordinates &&
    !!bookable.location.coordinates.points[0] &&
    !!bookable.location.coordinates.points[1]
  );
}
function getCoordinatesForBookable(bookable) {
  if (
    bookable.location &&
    bookable.location.coordinates &&
    bookable.location.coordinates.points
  ) {
    return [
      bookable.location.coordinates.points[1],
      bookable.location.coordinates.points[0],
    ];
  }
  return [];
}

function openBookableDetails(bookable) {
  goToDetailsNewTab(bookable.item.id, bookable.item.type);
}
</script>

<style>
.leaflet-tooltip.clean-tooltip {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  color: #000; /* oder was du willst */
}
</style>
