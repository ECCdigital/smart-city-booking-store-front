<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import "@vuepic/vue-datepicker/dist/main.css";
import SearchBar from "~/components/search/SearchBar.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";
import FilterArea from "~/components/search/FilterArea.vue";
import SortButton from "~/components/search/SortButton.vue";
import FilterButton from "~/components/search/FilterButton.vue";

definePageMeta({ name: "tenant-catalog-locations", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
const tenantID = computed(() => route.params.tenantID);

const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();
await loadBundle({
  tenantID: tenantID.value,
  slug: catalogSlug.value,
  include: ["bookables"],
});

const allLocations = computed(() => {
  const tenantFilter = tenantID.value
    ? (loc) => loc.tenantId === tenantID.value
    : () => true;

  const locations = bookableStore.getLocations.filter(tenantFilter);
  const rooms = bookableStore.getRooms.filter(tenantFilter);
  return locations.concat(rooms);
});

const filteredLocations = ref([]);
const filteredResultLocations = ref([]);
const filterResetKey = ref(0);
const searchIsInitialized = ref(false);

// Initialization: Show all items before the first search
function initializeResults() {
  // Set status: Bookable -> "suitable", others -> "nonBookable"
  const withStatus = allLocations.value.map((location) => {
    if (location.isBookable) {
      return { item: location, status: "suitable", calculatedPrice: null };
    }
    return { item: location, status: "nonBookable", calculatedPrice: null };
  });
  filteredLocations.value = withStatus;
  filteredResultLocations.value = withStatus;
}

//Stay reactive in case the store loads data later.
watch(
  () => allLocations.value,
  (val) => {
    if (!val || val.length === 0) {
      filteredLocations.value = [];
      filteredResultLocations.value = [];
      return;
    }
    // Only initialize if no status exists yet (i.e., no search has been performed yet)
    // Nur initialisieren, wenn noch kein Status existiert (d.h. noch keine Suche)
    /**
   const hasStatus = filteredLocations.value.some((b) => b?.status);
   if (!hasStatus) {
   initializeResults();
   }
   **/

    initializeResults();
  },
  { immediate: true, deep: true }
);

//Search
const currentSearchParams = ref({});
function onSearch({ items, searchParams }) {
  filteredLocations.value = items;
  filteredResultLocations.value = items;
  currentSearchParams.value = searchParams;
}

const suitableCount = computed(
  () =>
    filteredResultLocations.value.filter((l) => l.status === "suitable").length
);

//Sort & Filter
function setFilteredLocations(locations) {
  filteredResultLocations.value = locations;
}
function setSortedLocations(locations) {
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
        @search="onSearch"
      />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span
        v-if="searchIsInitialized"
        class="text-black dark:text-white lg:font-bold"
        >{{ suitableCount }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="filteredLocations.length > 0"
          :items-to-sort="filteredResultLocations"
          @sort="setSortedLocations"
        />
        <FilterButton
          v-if="filteredLocations.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredLocations"
          class="lg:hidden"
          @filter="setFilteredLocations"
        />
      </div>
    </div>

    <div v-if="!filteredResultLocations.length" class="text-center mt-10">
      <UIcon size="48" name="i-lucide-map-pin-off" class="text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("locations.noLocations") }}</p>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div class="md:basis-1/4 hidden md:block">
        <FilterArea
          v-if="filteredLocations.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredLocations"
          @filter="setFilteredLocations"
        />
      </div>

      <div class="md:basis-3/4">
        <ResultsList
          v-if="filteredResultLocations.length"
          :bookables="filteredResultLocations"
          :search-params="currentSearchParams"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="filteredResultLocations.length"
          :bookables="filteredResultLocations"
          :search-params="currentSearchParams"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>

<style></style>
