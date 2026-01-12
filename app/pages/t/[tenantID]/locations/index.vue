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
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";

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

const {
  query,
  queryTimePeriod,
  searchIsInitialized,
  filterResetKey,
  updatedItems: searchedLocations,
  sortedItems: sortedLocations,
  suitableCount,
  setFilterQueryParams,
  setSortedQueryParams,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: allLocations });
</script>

<template>
  <div>
    <div class="flex justify-center">
      <SearchBar
        v-model:is-initailized="searchIsInitialized"
        v-model:filter-reset-key="filterResetKey"
        :term="query.term"
        :location="query.location"
        :time-start="query.start"
        :time-end="query.end"
        :is-event="false"
        @search="runSearch"
        @reset="resetResults"
      />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span
          v-if="searchIsInitialized"
          class="text-black dark:text-white lg:font-bold"
      >{{ suitableCount }}  {{ $t("filter.fittingResults") }}</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="searchedLocations.length > 0"
          :sort-mode="query.sortMode"
          @sort="setSortedQueryParams"
        />
        <FilterButton
          v-if="searchedLocations.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="searchedLocations"
          :include-non-suitable="query.inclNoSuitable"
          :cities="query.cities"
          :price="query.price"
          :only-public-events="query.pubEv"
          :only-registered-events="query.regEv"
          class="lg:hidden"
          @filter="setFilterQueryParams"
        />
      </div>
    </div>

    <div v-if="!sortedLocations.length" class="text-center mt-10">
      <UIcon size="48" name="i-lucide-map-pin-off" class="text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("locations.noLocations") }}</p>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div class="lg:basis-1/4 hidden lg:block">
        <FilterArea
          v-if="searchedLocations.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :include-non-suitable="query.inclNoSuitable"
          :cities="query.cities"
          :price="query.price"
          :only-public-events="query.pubEv"
          :only-registered-events="query.regEv"
          :bookables="searchedLocations"
          @filter="setFilterQueryParams"
        />
      </div>

      <div class="basis-full lg:basis-3/4">
        <ResultsList
          v-if="sortedLocations.length > 0"
          :bookables="sortedLocations"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="sortedLocations.length > 0"
          :bookables="sortedLocations"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>
