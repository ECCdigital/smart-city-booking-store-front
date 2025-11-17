<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import SearchBar from "../../components/search/SearchBar.vue";
import ResultsList from "../../components/search/ResultsList.vue";
import { useBookables } from "~/composables/api/useBookables.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import ResultsGrid from "../../components/search/ResultsGrid.vue";
import FilterArea from "../../components/search/FilterArea.vue";
import SortButton from "../../components/search/SortButton.vue";
import FilterButton from "../../components/search/FilterButton.vue";

definePageMeta({ name: "catalog-locations", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();
await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allLocations = computed(() => {
  const locations = bookableStore.getLocations;
  return locations.concat(bookableStore.getRooms);
});
const filteredLocations = ref([]);
const filteredResultLocations = ref([]);
const filterResetKey = ref(0);

// Initialisierung: Vor der ersten Suche alles anzeigen
function initializeResults() {
  // Status setzen: Buchbare -> "suitable", andere -> "nonBookable"
  const withStatus = allLocations.value.map((location) => {
    if (location.isBookable) {
      return { item: location, status: "suitable", calculatedPrice: null };
    }
    return { item: location, status: "nonBookable", calculatedPrice: null };
  });
  filteredLocations.value = withStatus;
  filteredResultLocations.value = withStatus;
}

// Reaktiv bleiben, falls der Store später Daten nachlädt
watch(
  () => allLocations.value,
  (val) => {
    if (!val || val.length === 0) {
      filteredLocations.value = [];
      filteredResultLocations.value = [];
      return;
    }
    // Nur initialisieren, wenn noch kein Status existiert (d.h. noch keine Suche)
    const hasStatus = filteredLocations.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true },
);

const sortMode = ref("relevance");

//Search
const searchIsInitialized = ref(false);
function onSearch(locationsArray) {
  filteredLocations.value = locationsArray
  filteredResultLocations.value = locationsArray;
}

function numberOfSuitableBookables() {
  return filteredResultLocations.value.filter((l) => l.status === "suitable")
    .length;
}

function getPrice(item) {
  if (searchIsInitialized.value) {
    return item.calculatedPrice?.userGrossPriceEur;
  }
  if (
    item.bookable.priceCategories &&
    item.bookable.priceCategories.length > 0
  ) {
    return Math.min(
      ...item.bookable.priceCategories.map((cat) => cat.priceEur),
    );
  }
  return Infinity;
}

function sortBookables(mode) {
  sortMode.value = mode;
  //toDo - Sortierung nach Beliebtheit ergänzen?!

  //Default: momentan "Relevanz" nach Fuze-Suche...
  filteredLocations.value = filteredLocations.value.sort((a, b) => {
    //Sortieren nach Preis
    if (mode === "priceAscending") {
      return getPrice(a) - getPrice(b);
    }
    if (mode === "priceDescending") {
      return getPrice(b) - getPrice(a);
    }

    //toDo - Sortierung nach Distanz ergänzen!!
    //Sortieren nach Distanz
    if (mode === "distanceAscending" || mode === "distanceDescending") {
      // Momentan keine Entfernung vorhanden, also keine Sortierung
      /*
      if (mode === "distanceAscending") {
        return a.calculatedDistance - b.calculatedDistance;
      } else if (mode === "distanceDescending") {
        return b.calculatedDistance - a.calculatedDistance;
      } else {
        return 0;
      }
      */
      return 0;
    }
  });
}

function setFilteredLocations(locations) {
  filteredResultLocations.value = locations;
}
</script>

<template>
  <div>
    <div class="flex justify-center">
      <SearchBar
          v-model:is-initailized="searchIsInitialized"
          v-model:filter-reset-key="filterResetKey"
          :items-to-search="allLocations"
          @initialize="initializeResults"
          @search="onSearch" />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span
        v-if="searchIsInitialized"
        class="text-black dark:text-white lg:font-bold"
        >{{ numberOfSuitableBookables() }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="filteredLocations.length > 0"
          :sort-mode="sortMode"
          @sort="sortBookables"
        />
        <FilterButton
          v-if="filteredLocations.length > 0"
          :bookables="filteredLocations"
          class="lg:hidden"
          @filter="setFilteredLocations"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="md:basis-1/4">
        <FilterArea
          v-if="filteredLocations.length > 0"
          :key="filterResetKey"
          :bookables="filteredLocations"
          @filter="setFilteredLocations"
        />
      </div>

      <div class="md:basis-3/4">
        <ResultsList
          v-if="isGreaterThanMd"
          :bookables="filteredResultLocations"
          include-non-bookable
          include-non-suitable
        />
        <ResultsGrid
          v-else
          :bookables="filteredResultLocations"
          include-non-bookable
          include-non-suitable
        />
      </div>
    </div>
  </div>
</template>

<style></style>
