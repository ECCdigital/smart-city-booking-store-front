<template>
  <div v-if="!fetchedCoordinates && !hasBounds">
    <USkeleton class="w-full lg:w-[70vw] h-[80vh] m-2 rounded" />
  </div>
  <div
    v-else
    class="w-full lg:w-[70vw] h-[80vh] z-10 m-2 rounded overflow-hidden"
  >
    <ClientOnly>
      <LMap
        ref="mapRef"
        class="h-full w-full"
        :use-global-leaflet="false"
        :center="[51.2, 9.4]"
        :zoom="8"
        @ready="onMapReady"
      >
        <LTileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
          layer-type="overlay"
          name="Light  OpenStreetMap"
        />

        <div v-for="bookable in bookables" :key="bookable.item.id">
          <LMarker
            v-if="hasCoordinates(bookable.item)"
            :lat-lng="getCoordinatesForBookable(bookable.item)"
            :z-index-offset="
              bookable.item.id === currentBookable?.item.id
                ? 1000
                : bookable.matchStatus === 'match'
                  ? 500
                  : 0
            "
            @click="openBookableDetails(bookable)"
          >
            <LIcon :icon-anchor="[20, 40]">
              <UIcon
                :name="iconMapPin"
                :class="
                  bookable.item.id === currentBookable?.item.id
                    ? 'activeIconPin size-11'
                    : bookable.matchStatus === 'match'
                      ? 'matchingIconPin size-10'
                      : 'nonMatchingIconPin size-10'
                "
              />
            </LIcon>

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
    </ClientOnly>

    <!-- Mobile Detail Popup -->
    <Transition name="fade-up">
      <div
        v-if="showCurrentBookable && currentBookable"
        class="fixed inset-0 z-[1000] flex items-end justify-center md:hidden"
        @click="closeBookableDetails"
      >
        <div
          class="mb-4 w-[92%] max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          @click.stop="openBookableDetails(currentBookable, true)"
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
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import { nextTick } from "vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});

const {iconMapPin} = useBookableMap()
const { goToDetailsNewTab } = useRedirection();
const { searchAddress } = useBookableSearch({
  isEvent: false,
  sourceItems: props.bookables,
});

const route = useRoute();
const mapRef = ref(null);
const mapReady = ref(false);

const fetchedCoordinates = ref(false);

const currentCenter = ref([53.5, 10.0]);

const bounds = computed(() => {
  const coords = props.bookables
    .filter((b) => hasCoordinates(b.item))
    .map((b) => getCoordinatesForBookable(b.item));

  if (!coords.length) return null;

  if (coords.length === 1) {
    const [lat, lng] = coords[0];

    return [
      [lat - 0.01, lng - 0.01],
      [lat + 0.01, lng + 0.01],
    ];
  }

  const lats = coords.map((c) => c[0]);
  const lngs = coords.map((c) => c[1]);

  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ];
});
const hasBounds = computed(() => {
  return Array.isArray(bounds.value) && bounds.value.length === 2;
});

const showCurrentBookable = ref(false);
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

async function getCenterCoordinates(addressString) {
  if (!addressString) {
    return [53.5, 10.0];
  }

  fetchedCoordinates.value = false;

  try {
    const searchCoordinates = await searchAddress(addressString);

    if (Array.isArray(searchCoordinates) && searchCoordinates.length >= 2) {
      return [Number(searchCoordinates[1]), Number(searchCoordinates[0])];
    }
  } catch (e) {
    console.error(e);
  } finally {
    fetchedCoordinates.value = true;
  }

  return [53.5, 10.0];
}

function openBookableDetails(bookable, handleCardClickOnMobile = false) {
  if (!bookable) return;

  if (
    window.matchMedia("(min-width: 768px)").matches ||
    handleCardClickOnMobile
  ) {
    goToDetailsNewTab(bookable.item.id, bookable.item.type);
  } else {
    showCurrentBookable.value = true;
    currentCenter.value = getCoordinatesForBookable(bookable.item);
    currentBookable.value = bookable;

    document
      .querySelector(".leaflet-container")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
function closeBookableDetails() {
  showCurrentBookable.value = false;
  currentBookable.value = null;
}

function onMapReady() {
  mapReady.value = true;
}

// watch for bookables or bounds change and fit map to show all results if no location search
watch(
  [mapReady, () => bounds.value, () => props.bookables.length],
  async ([ready, newBounds, count]) => {
    if (!ready) return;
    if (!newBounds) return;
    if (!count) return;
    if (route.query.loc) return;

    const map = mapRef.value?.leafletObject;

    if (!map) return;

    await nextTick();

    setTimeout(() => {
      map.invalidateSize(true);

      map.fitBounds(newBounds, {
        padding: [20, 20],
        animate: false,
      });
    }, 300);
  },
  {
    immediate: true,
  },
);

//watch for location search and set map center accordingly
watch(
  () => route.query.loc,
  async (newLoc) => {
    const map = mapRef.value?.leafletObject;

    if (!map) return;

    await nextTick();

    // center search location
    if (newLoc) {
      const center = await getCenterCoordinates(decodeURIComponent(newLoc));

      setTimeout(() => {
        map.setView(center, 8, {
          animate: false,
        });
      }, 200);

      return;
    }

    // show all results if no location search
    if (bounds.value) {
      setTimeout(() => {
        map.fitBounds(bounds.value, {
          padding: [20, 20],
          animate: false,
        });
      }, 200);
    }
  },
  {
    immediate: true,
  },
);
</script>

<style>
.leaflet-tooltip.clean-tooltip {
  background: transparent;
  border: none;
  border-radius: 50px;
  box-shadow: 5px;
  padding: 0;
  color: #000;
}

.leaflet-div-icon {
  background: transparent;
  border: transparent;
}

.activeIconPin {
  color: var(--color-secondary);
  z-index: 999;
}

.matchingIconPin {
  z-index: 500;
}

.nonMatchingIconPin {
  color: #cccdcf;
  opacity: 0.7;
  z-index: 50;
}
</style>
