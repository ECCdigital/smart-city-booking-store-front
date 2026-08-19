<template>
  <div v-if="!fetchedCoordinates && !hasBounds">
    <USkeleton class="w-full h-[80vh] my-2 rounded" />
  </div>
  <div v-else class="flex w-full">
    <div
      class="w-full lg:flex-1 lg:min-w-0 h-[80vh] z-10 my-2 mr-0.5 rounded overflow-hidden"
    >
      <ClientOnly>
        <LMap
          ref="mapRef"
          class="h-full w-full"
          :use-global-leaflet="false"
          :center="[51.2, 9.4]"
          :zoom="8"
          @ready="onMapReady"
          @moveend="updateMapBounds"
          @zoomend="updateMapBounds"
        >
          <LTileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            layer-type="overlay"
            name="Light  OpenStreetMap"
          />

          <div
            v-for="group in groupedBookables"
            :key="group.coordinates.join('_')"
          >
            <LMarker
              :lat-lng="group.coordinates"
              :z-index-offset="
                getMarkerStatus(group) === 'active'
                  ? 1000
                  : getMarkerStatus(group) === 'match'
                    ? 500
                    : 0
              "
              @click="openGroup(group)"
            >
              <ResultsMapMarkerIcon
                :group="group"
                :current-bookable="currentBookable"
                :marker-status="getMarkerStatus(group)"
              />

              <ResultsMapMarkerPopup
                :group="group"
                @open-details="openBookableDetails"
                @close-group="closeGroup"
              />

              <ResultsMapMarkerTooltip :group="group" />
            </LMarker>
          </div>
        </LMap>
      </ClientOnly>

      <!-- Mobile Detail Popup -->
      <ResultsMapMobilePopup
        :current-bookable="currentBookable"
        :current-group="currentMultiPinGroup"
        :show-current-bookable="showCurrentBookable"
        :show-current-group="showMultiPinItems"
        @open-details="openBookableDetails"
        @close-details="closeBookableDetails"
      />
    </div>

    <!-- List of visible bookables -->
    <ResultsMapList
      v-model="currentBookable"
      :bookables="visibleBookables"
      @open-details="openBookableDetails"
    />
  </div>
</template>
<script setup>
import { useRedirection } from "~/composables/utils/useRedirection.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import { nextTick } from "vue";
import ResultsMapMarkerIcon from "~/components/search/ResultsMapMarkerIcon.vue";
import ResultsMapMarkerPopup from "~/components/search/ResultsMapMarkerPopup.vue";
import ResultsMapMarkerTooltip from "~/components/search/ResultsMapMarkerTooltip.vue";
import ResultsMapMobilePopup from "~/components/search/ResultsMapMobilePopup.vue";
import ResultsMapList from "~/components/search/ResultsMapList.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});

const { goToDetailsNewTab } = useRedirection();
const { searchAddress } = useBookableSearch({
  isEvent: false,
  sourceItems: props.bookables,
});

const route = useRoute();
const mapRef = ref(null);
const mapReady = ref(false);

const fetchedCoordinates = ref(false);

const showMultiPinItems = ref(false);
const currentMultiPinGroup = ref(null);
const groupedBookables = computed(() => {
  const groups = new Map();

  props.bookables.forEach((bookable) => {
    if (!hasCoordinates(bookable.item)) return;

    const [lat, lng] = getCoordinatesForBookable(bookable.item);

    // Falls die Koordinaten minimal unterschiedlich sein können:
    const key = `${lat.toFixed(6)}_${lng.toFixed(6)}`;

    if (!groups.has(key)) {
      groups.set(key, {
        coordinates: [lat, lng],
        bookables: [],
      });
    }

    groups.get(key).bookables.push(bookable);
    groups.get(key).bookables.sort((a, b) => {
      const aIsMatch = a.matchStatus === "match" ? 0 : 1;
      const bIsMatch = b.matchStatus === "match" ? 0 : 1;
      return aIsMatch - bIsMatch;
    });
  });

  return [...groups.values()];
});

const initialBounds = computed(() => {
  const withCoords = props.bookables.filter((b) => hasCoordinates(b.item));
  const matches = withCoords.filter((b) => b.matchStatus === "match");
  const coords = (matches.length ? matches : withCoords).map((b) =>
    getCoordinatesForBookable(b.item),
  );

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
const currentBounds = ref(initialBounds.value);

const hasBounds = computed(() => {
  return Array.isArray(initialBounds.value) && initialBounds.value.length === 2;
});

const showCurrentBookable = ref(false);
const currentBookable = ref(null);

const visibleBookables = computed(() => {
  if (!currentBounds.value) return props.bookables;

  return props.bookables
    .filter((b) => {
      if (!hasCoordinates(b.item)) return false;

      const [lat, lng] = getCoordinatesForBookable(b.item);

      return (
        lat >= currentBounds.value[0][0] &&
        lat <= currentBounds.value[1][0] &&
        lng >= currentBounds.value[0][1] &&
        lng <= currentBounds.value[1][1]
      );
    })
    .sort((a, b) => {
      const aIsMatch = a.matchStatus === "match" ? 0 : 1;
      const bIsMatch = b.matchStatus === "match" ? 0 : 1;
      return aIsMatch - bIsMatch;
    });
});

function getMarkerStatus(group) {
  if (
    currentBookable.value &&
    group.bookables.some((b) => b.item.id === currentBookable.value.item.id)
  ) {
    return "active";
  } else if (group.bookables.some((b) => b.matchStatus === "match")) {
    return "match";
  }
  return "nomatch";
}
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

function updateMapBounds() {
  const map = mapRef.value?.leafletObject;

  if (!map) return;

  const mapBounds = map.getBounds();

  currentBounds.value = [
    [mapBounds.getSouth(), mapBounds.getWest()],
    [mapBounds.getNorth(), mapBounds.getEast()],
  ];
}
function updateMapCenter(coordinates, southOffset = 0.05) {
  const map = mapRef.value?.leafletObject;

  if (map) {
    const currentZoom = map.getZoom();
    map.setView([coordinates[0] - southOffset, coordinates[1]], currentZoom, {
      animate: false,
    });
  }
}

function openGroup(group) {
  if (group.bookables.length === 1) {
    openBookableDetails(group.bookables[0]);
    return;
  }

  currentMultiPinGroup.value = group;
  currentBookable.value = group.bookables[0];
  showMultiPinItems.value = true;

  // Only recenter on mobile
  if (!window.matchMedia("(min-width: 768px)").matches) {
    updateMapCenter(group.coordinates);
  }
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
    currentBookable.value = bookable;

    updateMapCenter(getCoordinatesForBookable(bookable.item));
  }
}
function closeGroup() {
  showMultiPinItems.value = false;
  currentMultiPinGroup.value = null;
  currentBookable.value = null;
}
function closeBookableDetails() {
  showCurrentBookable.value = false;
  currentBookable.value = null;

  showMultiPinItems.value = false;
  currentMultiPinGroup.value = null;
}

function onMapReady() {
  mapReady.value = true;
}

// watch for bookables or bounds change and fit map to show all results if no location search
watch(
  [mapReady, () => initialBounds.value, () => props.bookables.length],
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
        map.fitBounds(initialBounds.value, {
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

<style></style>
