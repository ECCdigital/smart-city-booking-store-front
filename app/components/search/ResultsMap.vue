<template>
  <!--
    The map stays mounted whatever the results are. Swapping it for a
    skeleton while Leaflet is still initialising left Leaflet without its
    container ("Map container not found"), and a search with no placeable
    result then never got a map to centre on the address.
  -->
  <div
    class="results-map"
    :class="
      isFullscreen
        ? 'fixed inset-0 z-[1000] bg-neutral-50 dark:bg-gray-950'
        : 'flex w-full'
    "
  >
    <div
      class="z-10 overflow-hidden"
      :class="
        isFullscreen
          ? 'absolute inset-0'
          : 'relative w-full lg:flex-1 lg:min-w-0 h-[80vh] my-2 mr-0.5 rounded'
      "
    >
      <ClientOnly>
        <LMap
          ref="mapRef"
          class="h-full w-full"
          :use-global-leaflet="false"
          :center="START_CENTER"
          :zoom="START_ZOOM"
          :options="{ zoomControl: false }"
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

      <div class="absolute right-4 top-4 z-1001">
        <div
          class="flex items-center gap-3 rounded-xl py-1.5"
          :class="isFullscreen ? 'pl-4' : ''"
        >
          <UButton
            :label="
              isFullscreen
                ? $t('results.exitFullscreen')
                : $t('results.fullscreen')
            "
            :icon="isFullscreen ? 'i-lucide-minimize-2' : 'i-lucide-maximize-2'"
            class="rounded-lg py-2 px-3 shadow-md glass text-black dark:text-white"
            @click="setFullscreen(!isFullscreen)"
          />
          <template v-if="isFullscreen">
            <span
              v-if="suitableCount !== null"
              class="hidden sm:inline text-sm font-bold text-black dark:text-white rounded-lg py-2 px-3 shadow-md glass"
            >
              {{ $t("filter.fittingResults", suitableCount) }}
            </span>
            <UButton
              :label="$t('results.list')"
              icon="i-lucide-list"
              :aria-pressed="showList"
              class="hidden lg:inline-flex rounded-lg py-2 px-3 shadow-md"
              :class="
                showList ? 'bg-primary/80' : 'glass text-black dark:text-white'
              "
              :style="showList ? { color: contrastToPrimary } : undefined"
              @click="showList = !showList"
            />
            <slot name="filter" />
          </template>
        </div>
      </div>

      <!--
        Leaflet's own zoom control is off; these two buttons zoom instead.
      -->
      <div
        class="absolute top-4 left-4 z-1001 flex flex-col gap-1 rounded-xl p-1.5"
      >
        <UButton
          icon="i-lucide-plus"
          class="rounded-lg p-2 shadow-md glass text-black dark:text-white"
          :aria-label="$t('results.zoomIn')"
          :disabled="currentZoom >= maxZoom"
          @click="zoomBy(1)"
        />
        <UButton
          icon="i-lucide-minus"
          class="rounded-lg p-2 shadow-md glass text-black dark:text-white"
          :aria-label="$t('results.zoomOut')"
          :disabled="currentZoom <= minZoom"
          @click="zoomBy(-1)"
        />
      </div>
    </div>

    <!-- List of visible Offers, then the ones the map cannot place -->
    <Transition
      enter-active-class="transition duration-200 ease-out motion-reduce:transition-none"
      enter-from-class="translate-x-4 opacity-0"
      leave-active-class="transition duration-150 ease-in motion-reduce:transition-none"
      leave-to-class="translate-x-4 opacity-0"
    >
      <ResultsMapList
        v-if="!isFullscreen || showList"
        v-model="currentBookable"
        :bookables="visibleBookables"
        :without-location="withoutLocation"
        :floating="isFullscreen"
        @open-details="openBookableDetails"
      />
    </Transition>
  </div>
</template>
<script setup>
import { useRedirection } from "~/composables/utils/useRedirection.js";
import { searchAddress } from "~/composables/search/useBookableSearch.js";
import { nextTick } from "vue";
import ResultsMapMarkerIcon from "~/components/search/ResultsMapMarkerIcon.vue";
import ResultsMapMarkerPopup from "~/components/search/ResultsMapMarkerPopup.vue";
import ResultsMapMarkerTooltip from "~/components/search/ResultsMapMarkerTooltip.vue";
import ResultsMapMobilePopup from "~/components/search/ResultsMapMobilePopup.vue";
import ResultsMapList from "~/components/search/ResultsMapList.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToPrimary } = useContrastColor();

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
  includeNonSuitable: {
    type: Boolean,
    default: false,
  },
  suitableCount: {
    type: Number,
    default: null,
  },
});

const shownBookables = computed(() =>
  props.includeNonSuitable
    ? props.bookables
    : props.bookables.filter((b) => b.matchStatus === "match"),
);

const { goToDetailsNewTab } = useRedirection();

const route = useRoute();
const mapRef = ref(null);
const mapReady = ref(false);

// The start view, before the results or the searched place move the map.
const START_CENTER = [51.2, 9.4];
const START_ZOOM = 8;

// The two view changes below are deferred; a view toggle can unmount the map
// in between, and Leaflet throws when a removed map is moved.
let unmounted = false;
onBeforeUnmount(() => {
  unmounted = true;
  window.removeEventListener("keydown", onKeydown);
  document.body.classList.remove("overflow-hidden");
});

// Full screen is a fixed overlay, not the Fullscreen API
const isFullscreen = ref(false);
const showList = ref(true);

async function setFullscreen(on) {
  isFullscreen.value = on;
  showList.value = true;
  document.body.classList.toggle("overflow-hidden", on);

  await nextTick();

  const map = mapRef.value?.leafletObject;

  if (!map) return;

  setTimeout(() => {
    if (unmounted) return;

    map.invalidateSize();
    // A bigger map shows more Offers; the list follows the new bounds.
    updateMapBounds();
  }, 50);
}

// Escape leaves full screen, unless an open dialog (the filter) takes it.
function onKeydown(event) {
  if (event.key !== "Escape" || !isFullscreen.value) return;
  if (document.querySelector('[role="dialog"][data-state="open"]')) return;

  setFullscreen(false);
}
onMounted(() => {
  window.addEventListener("keydown", onKeydown);
});

const showMultiPinItems = ref(false);
const currentMultiPinGroup = ref(null);
const groupedBookables = computed(() => {
  const groups = new Map();

  shownBookables.value.forEach((bookable) => {
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
  const withCoords = shownBookables.value.filter((b) => hasCoordinates(b.item));
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

const showCurrentBookable = ref(false);
const currentBookable = ref(null);

// Not on the map, so not in the map's own list either; they get their own
// block at the end of it.
const withoutLocation = computed(() =>
  shownBookables.value
    .filter((b) => !hasCoordinates(b.item))
    .sort((a, b) => {
      const aIsMatch = a.matchStatus === "match" ? 0 : 1;
      const bIsMatch = b.matchStatus === "match" ? 0 : 1;
      return aIsMatch - bIsMatch;
    }),
);

const visibleBookables = computed(() => {
  if (!currentBounds.value) {
    return shownBookables.value.filter((b) => hasCoordinates(b.item));
  }

  return shownBookables.value
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

  try {
    const searchCoordinates = await searchAddress(addressString);

    if (Array.isArray(searchCoordinates) && searchCoordinates.length >= 2) {
      return [Number(searchCoordinates[1]), Number(searchCoordinates[0])];
    }
  } catch (e) {
    console.error(e);
  }

  return [53.5, 10.0];
}

// The zoom buttons in the template replace Leaflet's control; they grey out
// at either end of the range, which the map knows once it is ready.
const currentZoom = ref(START_ZOOM);
const minZoom = ref(0);
const maxZoom = ref(Infinity);

function zoomBy(delta) {
  const map = mapRef.value?.leafletObject;

  if (!map) return;

  if (delta > 0) map.zoomIn();
  else map.zoomOut();
}

function updateMapBounds() {
  const map = mapRef.value?.leafletObject;

  if (!map) return;

  currentZoom.value = map.getZoom();

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

  const map = mapRef.value?.leafletObject;

  if (!map) return;

  currentZoom.value = map.getZoom();
  minZoom.value = map.getMinZoom();
  maxZoom.value = map.getMaxZoom();
}

// watch for bookables or bounds change and fit map to show all results if no location search
watch(
  [mapReady, () => initialBounds.value, () => shownBookables.value.length],
  async ([ready, newBounds, count]) => {
    if (!ready) return;
    if (!newBounds) return;
    if (!count) return;
    if (route.query.loc) return;

    const map = mapRef.value?.leafletObject;

    if (!map) return;

    await nextTick();

    setTimeout(() => {
      if (unmounted) return;

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

// Centre on the searched place, once the map exists to be centred: on a
// direct load the address is in the URL before Leaflet is ready.
watch(
  [mapReady, () => route.query.loc],
  async ([ready, newLoc]) => {
    if (!ready) return;

    const map = mapRef.value?.leafletObject;

    if (!map) return;

    await nextTick();

    // center search location
    if (newLoc) {
      const center = await getCenterCoordinates(decodeURIComponent(newLoc));

      setTimeout(() => {
        if (unmounted) return;

        map.setView(center, START_ZOOM, {
          animate: false,
        });
      }, 200);

      return;
    }

    // show all results if no location search
    if (initialBounds.value) {
      setTimeout(() => {
        if (unmounted) return;

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

<style>
/* The map follows the colour mode. The CSP allows tiles from OpenStreetMap
   only, so the dark basemap is the same tiles inverted and hue-rotated, not
   a second provider. */
.dark .results-map .leaflet-tile-pane {
  filter: invert(1) hue-rotate(180deg) brightness(0.92) contrast(0.9)
    saturate(0.7);
}
</style>
