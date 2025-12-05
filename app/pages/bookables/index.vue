<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import SearchBar from "../../components/search/SearchBar.vue";
import SortButton from "../../components/search/SortButton.vue";
import FilterButton from "../../components/search/FilterButton.vue";
import FilterArea from "~/components/search/FilterArea.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";

definePageMeta({
  name: "catalog-bookables",
  layout: "catalog",
});

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
await loadBundle({ include: ["bookables"] });

const allResources = computed(() => {
  return bookableStore.getResources;
});

const {
  query,
  queryTimePeriod,
  searchIsInitialized,
  filterResetKey,
  updatedItems: searchedResources,
  sortedItems: sortedResources,
  suitableCount,
  setFilterQueryParams,
  setSortedQueryParams,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: allResources });
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
        >{{ suitableCount }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="searchedResources.length > 0"
          :sort-mode="query.sortMode"
          @sort="setSortedQueryParams"
        />
        <FilterButton
          v-if="searchedResources.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="searchedResources"
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

    <div v-if="!sortedResources.length" class="text-center mt-10">
      <UIcon size="48" name="i-lucide-monitor-off" class="text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("resources.noResources") }}</p>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div class="lg:basis-1/4 hidden lg:block">
        <FilterArea
          v-if="searchedResources.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :include-non-suitable="query.inclNoSuitable"
          :cities="query.cities"
          :price="query.price"
          :only-public-events="query.pubEv"
          :only-registered-events="query.regEv"
          :bookables="searchedResources"
          @filter="setFilterQueryParams"
        />
      </div>

      <div class="basis-full lg:basis-3/4">
        <ResultsList
          v-if="sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>
