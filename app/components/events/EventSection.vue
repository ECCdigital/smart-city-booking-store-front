<template>
  <div class="bg-neutral-50 dark:bg-gray-950">
    <div class="flex justify-center">
      <SearchBar
        v-model:is-initailized="searchIsInitialized"
        v-model:filter-reset-key="filterResetKey"
        search-type="events"
        :term="query.term"
        :location="query.location"
        :distance="query.distance"
        :time-start="query.start"
        :time-end="query.end"
        @search="runSearch"
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
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="searchedEvents.length > 0"
          :sort-mode="query.sortMode"
          is-event
          @sort="setSortedQueryParams"
        />
        <FilterButton
          v-if="searchedEvents.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="searchedEvents"
          :include-non-suitable="query.inclNoSuitable"
          :categories="query.cat"
          :cities="query.cities"
          :distance="query.distance"
          :price="query.price"
          :only-public-events="query.pubEv"
          :only-registration-needed-events="query.regEv"
          class="lg:hidden"
          is-event
          @filter="setFilterQueryParams"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div v-if="searchedEvents.length > 0" class="lg:basis-1/4 hidden lg:block">
        <FilterArea
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :include-non-suitable="query.inclNoSuitable"
          :cities="query.cities"
          :distance="query.distance"
          :price="query.price"
          :categories="query.cat"
          is-event
          :only-public-events="query.pubEv"
          :only-registration-needed-events="query.regEv"
          :bookables="searchedEvents"
          @filter="setFilterQueryParams"
        />
      </div>

      <div :class="searchedEvents.length > 0 ? 'basis-full lg:basis-3/4' : 'basis-full'">
        <div v-if="!sortedEvents.length" class="text-center mt-10 lg:mt-25">
          <UIcon
            size="48"
            name="i-lucide-calendar-off"
            class="text-gray-400 mb-4"
          />
          <p class="text-gray-500">{{ $t("events.noEvents") }}</p>
        </div>
        <ResultsList
          v-if="sortedEvents.length > 0"
          :bookables="sortedEvents"
          include-non-bookable
          include-non-suitable
          is-event-list
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="sortedEvents.length > 0"
          :bookables="sortedEvents"
          include-non-bookable
          include-non-suitable
          is-event-grid
          class="md:hidden"
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

const props = defineProps({
  events: {
    type: Array,
    required: true,
  },
});

const {
  query,
  searchIsInitialized,
  filterResetKey,
  updatedItems: searchedEvents,
  sortedItems: sortedEvents,
  suitableCount,
  setFilterQueryParams,
  setSortedQueryParams,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: true, sourceItems: props.events });
</script>

<style scoped></style>
