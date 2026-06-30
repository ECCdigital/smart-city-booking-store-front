<template>
  <div v-if="!fetchedCoordinates && !hasBounds">
    <USkeleton class="w-full lg:w-[70vw] h-[80vh] m-2 rounded" />
  </div>
  <div v-else class="flex">
    <div
      class="w-full lg:w-[70vw] h-[80vh] z-10 m-2 mr-0.5 rounded overflow-hidden"
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
                group.bookables.some(b=> b.item.id === currentBookable?.item.id)
                  ? 1000
                  : group.bookables.some(b=> b.matchStatus === 'match')
                    ? 500
                    : 0
              "
                @click="openGroup(group)">
              <LIcon :icon-anchor="[20, 40]">
                <div class="relative">
                  <UIcon
                      :name="iconMapPin"
                      :class="
                    group.bookables.some(b=> b.item.id === currentBookable?.item.id)
                      ? 'activeIconPin size-11'
                      : group.bookables.some(b=> b.matchStatus === 'match')
                        ? 'matchingIconPin size-10'
                        : 'nonMatchingIconPin size-10'
                  "
                  />

                  <div
                    v-if="group.bookables.length > 1"
                    class="absolute -top-1 left-6 w-5 h-5 rounded-full bg-red-600 text-white text-xs font-bold flex items-center justify-center"
                  >
                    {{ group.bookables.length }}
                  </div>
                </div>
              </LIcon>

              <LPopup
                v-if="group.bookables.length > 1"
                :options="{
                  minWidth: 320,
                  maxWidth: 320,
                }"
                class="flex justify-center bg-transparent"
              >
                <UCarousel
                  :items="group.bookables"
                  fade
                  dots
                  arrows
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
                  class="w-[300px] mx-auto pb-5"
                >
                  <template #default="{ item }">
                    <div class="flex justify-center w-full">
                      <ResultCard
                        :item="item.item"
                        :is-not-bookable="!item.isBookable"
                        :calculated-price="item.calculatedPrice"
                        map-detail-mode
                        class="w-full shadow-none"
                      />
                    </div>
                  </template>
                </UCarousel>
              </LPopup>

              <LTooltip
                :options="{ className: 'clean-tooltip' }"
                class="hidden md:block"
              >
                <div
                  v-if="group.bookables?.length === 1"
                  class="overflow-hidden rounded-2xl shadow-2xl"
                >
                  <ResultCard
                    :item="group.bookables[0].item"
                    :is-not-bookable="!group.bookables[0].isBookable"
                    :calculated-price="group.bookables[0].calculatedPrice"
                    map-detail-mode
                    class="w-[300px] break-normal"
                  />
                </div>

                <div
                  v-else-if="
                    group.bookables?.length === 2 ||
                    group.bookables?.length === 3
                  "
                  class="rounded-2xl bg-white shadow-2xl p-2 space-y-1"
                >
                  <div
                    v-for="bookable in group.bookables"
                    :key="bookable.item.id"
                    class=""
                  >
                    <ResultStrip
                      :item="bookable.item"
                      :is-not-suitable="bookable.matchStatus !== 'match'"
                      :calculated-price="bookable.calculatedPrice"
                      map-mode
                      class="h-36 w-85"
                    />
                  </div>
                </div>

                <div v-else class="rounded-2xl bg-white shadow-2xl p-2 w-80">
                  <p class="text-md font-bold mb-2">
                    {{ group.bookables.length }} Ergebnisse an diesem Standort:
                  </p>
                  <div
                    v-for="bookable in group.bookables"
                    :key="bookable.item.id"
                    class="bg-gray-200 dark:bg-gray-700 rounded-sm mb-2 last:mb-0 p-1 flex"
                    :class="bookable.matchStatus !== 'match'? 'opacity-70' : ''"
                  >
                    <div class="basis-1/8 flex items-center">
                      <BookablesBookableTypeBadge :type="bookable.item?.type" icon-only />
                    </div>
                    <div class="basis-7/8 flex items-center">
                      <div class="font-semibold break-words whitespace-normal">
                        {{ bookable.item?.title }}
                      </div>
                    </div>
                  </div>

                  <p class="text-center italic">
                    [ Klick um Auswahl zu öffnen ]
                  </p>
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

    <!-- List of visible bookables -->
    <div
      class="bg-auto w-[25%] h-[80vh] z-20 m-2 overflow-auto p-2 border border-gray-200 rounded"
    >
      <TransitionGroup name="list" tag="div" class="space-y-1">
        <div
          v-for="bookable in visibleBookables"
          :key="bookable.item.id"
          @mouseenter="currentBookable = bookable"
          @mouseleave="currentBookable = null"
        >
          <ResultStrip
            class="cursor-pointer"
            :item="bookable.item"
            :is-not-suitable="bookable.matchStatus !== 'match'"
            :calculated-price="bookable.calculatedPrice"
            map-mode
            @click="openBookableDetails(bookable, true)"
          />
        </div>
        <div v-if="!visibleBookables || visibleBookables.length === 0">
          <p class="text-center text-gray-500 mt-10">
            Keine Ergebnisse in diesem Bereich.
          </p>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
<script setup>
import ResultCard from "~/components/search/ResultCard.vue";
import { useRedirection } from "~/composables/utils/useRedirection.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import { nextTick } from "vue";
import ResultStrip from "~/components/search/ResultStrip.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});

const { iconMapPin } = useBookableMap();
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

const currentCenter = ref([53.5, 10.0]);

const initialBounds = computed(() => {
  const coords = props.bookables
    .filter((b) => hasCoordinates(b.item) && b.matchStatus === "match")
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

function openGroup(group) {
  if (group.bookables.length === 1) {
    openBookableDetails(group.bookables[0]);
    return;
  }

  console.log("open group", group);

  currentMultiPinGroup.value = group;
  showMultiPinItems.value = true;
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

<style>
/*map icons*/
.leaflet-tooltip.clean-tooltip {
  background: transparent;
  border: none;
  border-radius: 50px;
  box-shadow: 5px;
  padding: 0;
  color: #000;
}

.leaflet-tooltip.clean-tooltip::before {
  display: none;
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

/*list transition*/
.list-move, /* apply transition to moving elements */
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-leave-active {
  position: absolute;
}


/*Pop up*/
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

.leaflet-popup-tip {
  background: transparent !important;
  box-shadow: none !important;
}
</style>
