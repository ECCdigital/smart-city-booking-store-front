<template>
  <div class="w-full md:w-[70vw] h-[80vh] z-10">
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
          <LTooltip
            class="hidden md:block"
            :options="{ className: 'clean-tooltip' }"
          >
            <div class="overflow-hidden rounded-2xl shadow-2xl">
              <ResultCard
                :item="bookable.item"
                :is-not-bookable="!bookable.isBookable"
                :calculated-price="bookable.calculatedPrice"
                entry-page-mode
                class="w-[300px] break-normal"
              />
            </div>
          </LTooltip>
        </LMarker>
      </div>
    </LMap>
    <!-- Mobile Detail Popup -->
    <Transition name="fade-up">
      <div
          v-if="showDetailPopup && currentBookable"
          class="fixed inset-0 z-[1000] flex items-end justify-center md:hidden"
          @click="closeBookableDetails"
      >
        <div
            class="mb-4 w-[92%] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            @click.stop="openBookableDetails(currentBookable,true)"
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

const currentCenter = ref([53.5, 10.0])
const zoom = ref(8); //toDo - passenden Zoom-Level wählen

const showDetailPopup = ref(false);
const currentBookable = ref(null);

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

function openBookableDetails(bookable,handleCardClickOnMobile=false) {
  if(!bookable) return;

  if (window.matchMedia("(min-width: 768px)").matches || handleCardClickOnMobile) {
    goToDetailsNewTab(bookable.item.id, bookable.item.type);
  } else{
    showDetailPopup.value = true;
    currentCenter.value = getCoordinatesForBookable(bookable.item);
    currentBookable.value = bookable;

    document.querySelector('.leaflet-container')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function closeBookableDetails() {
  showDetailPopup.value = false;
  currentBookable.value = null;
}

</script>

<style>
.leaflet-tooltip.clean-tooltip {
  background: transparent;
  border: none;
  box-shadow: 5px;
  padding: 0;
  color: #000;
}
</style>
