<template>
  <div v-if="!fetchedCoordinates">
    <USkeleton class="w-full lg:w-[70vw] h-[80vh] m-2 rounded" />
  </div>
  <div v-else class="w-full lg:w-[70vw] h-[80vh] z-10 m-2 rounded overflow-hidden">
    {{ decodeURIComponent(route.query.loc) }} - {{ route.query.loc }}
    <br >
    {{ searchIsInitialized }}*** {{ query.location }}
    <br >
    {{ currentCenter }} - {{ zoom }}
    <br>
    fetchedCoordinates = {{fetchedCoordinates}}

    <LMap
      :key="currentCenter.join(',')"
      :zoom="zoom"
      :use-global-leaflet="false"
      :center="currentCenter"
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

    <!-- Mobile Detail Popup -->
    <Transition name="fade-up">
      <div
        v-if="showDetailPopup && currentBookable"
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

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});
const { goToDetailsNewTab } = useRedirection();
const route = useRoute();

const { query, searchIsInitialized, searchAddress } = useBookableSearch({
  isEvent: false,
  sourceItems: props.bookables,
});

const fetchedCoordinates = ref(false);
const currentCenter = ref([53.5, 10.0]);
const zoom = computed(() => {
  /*
  if (props.bookables.length === 0) return 8; // Default-Zoom, wenn keine Bookables vorhanden sind

  // Berechne die durchschnittlichen Koordinaten
  const latitudes = props.bookables
    .filter((b) => hasCoordinates(b.item))
    .map((b) => getCoordinatesForBookable(b.item)[0]);
  const longitudes = props.bookables
    .filter((b) => hasCoordinates(b.item))
    .map((b) => getCoordinatesForBookable(b.item)[1]);

  if (latitudes.length === 0 || longitudes.length === 0) return 8; // Fallback-Zoom, wenn keine gültigen Koordinaten vorhanden sind

  const avgLat =
    latitudes.reduce((sum, lat) => sum + lat, 0) / latitudes.length;
  const avgLng =
    longitudes.reduce((sum, lng) => sum + lng, 0) / longitudes.length;

  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  currentCenter.value = [avgLat, avgLng];
  return 12; // Angepasster Zoom-Level für die Mitte der Bookables
  */
  return 8;
});

const iconMapPin = () =>
  h(
    "svg",
    {
      viewBox: "0 0 24 24",
      class: "text-primary",
    },
    [
      h("path", {
        fill: "currentColor",
        stroke: "#5e5e5d",
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        "stroke-width": 0.7,
        d: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      }),
    ],
  );


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

/*async function getCenterCoordinates(addressString){
  console.log("Want to calculate center based on query.location: ", addressString)
  if(addressString){
    const searchCoordinates = await searchAddress(addressString)
    console.log("Calculated search coordinates: ", searchCoordinates)
    return [searchCoordinates[1], searchCoordinates[0]]
  }
  return [53.5, 10.0]
}*/
async function getCenterCoordinates(addressString) {
  if (!addressString) {
    return [53.5, 10.0];
  }

  fetchedCoordinates.value = true;

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

/*onMounted(async () => {
  if(query.location){
    currentCenter.value = await getCenterCoordinates(decodeURIComponent(route.query.loc))
  }
})*/

/*watch(() => route.query.loc, async (newQuery) => {
  console.log("Route query changed: ", newQuery)
  if(newQuery){
    //currentCenter.value = await getCenterCoordinates(decodeURIComponent(newQuery))
    console.log(await getCenterCoordinates(decodeURIComponent(newQuery)))
  }
})*/
watch(
  () => route.query.loc,
  async (newLoc) => {
    if (!newLoc){
      fetchedCoordinates.value = true;
      return;
    }

    try {
      const center = await getCenterCoordinates(decodeURIComponent(newLoc));

      if (
        Array.isArray(center) &&
        center.length === 2 &&
        center.every((n) => typeof n === "number")
      ) {
        currentCenter.value = center;
      }
    } catch (err) {
      console.error("Failed to update center:", err);
    }
  },
  { immediate: true },
);

function openBookableDetails(bookable, handleCardClickOnMobile = false) {
  if (!bookable) return;

  if (
    window.matchMedia("(min-width: 768px)").matches ||
    handleCardClickOnMobile
  ) {
    goToDetailsNewTab(bookable.item.id, bookable.item.type);
  } else {
    showDetailPopup.value = true;
    currentCenter.value = getCoordinatesForBookable(bookable.item);
    currentBookable.value = bookable;

    document
      .querySelector(".leaflet-container")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
