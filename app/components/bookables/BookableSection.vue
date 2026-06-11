<template>
  <div class="bg-neutral-50 dark:bg-gray-950">
    <div class="flex justify-center">
      <SearchBar
        v-model:is-initailized="searchIsInitialized"
        v-model:filter-reset-key="filterResetKey"
        search-type="bookables"
        :term="query.term"
        :location="query.location"
        :distance="query.distance"
        :time-start="query.start"
        :time-end="query.end"
        @search="onSearch"
        @reset="resetResults"
      />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span
        v-if="searchIsInitialized"
        class="text-black dark:text-white lg:font-bold"
        >{{ suitableCount }} {{ $t("filter.fittingResults") }}</span
      >
      <div class="" style="flex: 1" />
      <div class="grid md:flex space-x-2 space-y-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <div class="flex mb-2 md:my-0">
          <ResultViewButton
            v-model="currentView"
            @set-view="setViewQueryParams"
          />

          <FilterButton
            v-if="searchedResources.length > 0"
            v-model:is-initailized="searchIsInitialized"
            :bookables="searchedResources"
            :include-non-suitable="query.inclNoSuitable"
            :categories="query.cat"
            :cities="query.cities"
            :distance="query.distance"
            :price="query.price"
            :only-public-events="query.pubEv"
            :only-registration-needed-events="query.regEv"
            :custom-fields="query.customFields"
            :class="query.viewMode === 'map' ? 'ml-2 2xl:hidden': 'lg:hidden'"
            @filter="setFilterQueryParams"
          />
        </div>
        <SortButton
          v-if="searchedResources.length > 0"
          :sort-mode="query.sortMode"
          @sort="setSortedQueryParams"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div
        v-if="searchedResources.length > 0"
        :class="query.viewMode === 'map' ? 'hidden 2xl:block' : 'lg:basis-1/4 hidden lg:block'"
      >
        <FilterArea
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :include-non-suitable="query.inclNoSuitable"
          :categories="query.cat"
          :cities="query.cities"
          :distance="query.distance"
          :price="query.price"
          :only-public-events="query.pubEv"
          :only-registration-needed-events="query.regEv"
          :custom-fields="query.customFields"
          :bookables="searchedResources"
          @filter="setFilterQueryParams"
        />
      </div>

      <div
        :class="
          searchedResources.length === 0
            ? 'basis-full '
            : query.viewMode === 'map' ? 'basis-full 2xl:basis-3/4' : 'basis-full lg:basis-3/4'
        "
      >
        <div v-if="!sortedResources.length" class="text-center mt-10 lg:mt-25">
          <UIcon
            size="48"
            name="i-lucide-monitor-off"
            class="text-gray-400 mb-4"
          />
          <p class="text-gray-500">{{ $t("resources.noResources") }}</p>
        </div>
        <ResultsList
          v-if="currentView === 'list' && sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="currentView === 'list' && sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />

        <ResultsMap
          v-if="currentView === 'map' && sortedResources.length > 0"
          :bookables="sortedResources"
        />
      </div>
    </div>
  </div>
</template>
<script setup>
import FilterButton from "~/components/search/FilterButton.vue";
import FilterArea from "~/components/search/FilterArea.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import SearchBar from "~/components/search/SearchBar.vue";
import SortButton from "~/components/search/SortButton.vue";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
import ResultsMap from "~/components/search/ResultsMap.vue";
import ResultViewButton from "~/components/search/ResultViewButton.vue";

const props = defineProps({
  bookables: {
    type: Array,
    required: true,
  },
});

const {
  query,
  searchIsInitialized,
  filterResetKey,
  updatedItems: searchedResources,
  sortedItems: sortedResources,
  suitableCount,
  setFilterQueryParams,
  setSortedQueryParams,
  setViewQueryParams,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: props.bookables });

const currentView = ref(query.viewMode);

function onSearch(searchParams) {
  runSearch(searchParams);
}
</script>
<style scoped></style>
