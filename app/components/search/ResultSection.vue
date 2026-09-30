<template>
  <!--
    The Result Page's body: search bar, the count, the view toggle, filter and
    sort, then the filter area next to the list, grid or map. It lists Offers
    of every Kind together; the Kind is a facet in the filter area, not a
    page of its own.
  -->
  <div class="bg-neutral-50 dark:bg-gray-950">
    <div class="container">
      <div class="flex justify-center">
        <SearchBar
          v-model:is-initailized="searchIsInitialized"
          v-model:filter-reset-key="filterResetKey"
          :term="query.term"
          :location="query.location"
          :distance="query.distance"
          :time-start="query.start"
          :time-end="query.end"
          @search="runSearch"
          @reset="resetResults"
        />
      </div>

      <!-- Below the search bar: the bar overlaps the Hero's lower edge. -->
      <CatalogBreadcrumb class="mt-5" />

      <div class="mt-4 mb-10 lg:mb-5 sm:flex items-center">
        <span
          v-if="searchIsInitialized"
          class="text-black dark:text-white lg:font-bold"
          >{{ suitableCount }} {{ $t("filter.fittingResults") }}</span
        >
        <div class="" style="flex: 1" />
        <div class="grid md:flex gap-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
          <div class="flex mb-2 md:my-0">
            <ResultViewButton
              v-model="currentView"
              @set-view="setViewQueryParams"
            />

            <FilterButton
              v-if="searchedOffers.length > 0"
              v-model:is-initailized="searchIsInitialized"
              :bookables="searchedOffers"
              :include-non-suitable="query.inclNoSuitable"
              :categories="query.cat"
              :cities="query.cities"
              :tenants="query.tenants"
              :distance="query.distance"
              :price="query.price"
              :only-public-events="query.pubEv"
              :only-registration-needed-events="query.regEv"
              :custom-fields="query.customFields"
              :class="
                query.viewMode === 'map' ? 'ml-2 2xl:hidden' : 'lg:hidden'
              "
              @filter="setFilterQueryParams"
            />
          </div>
          <SortButton
            v-if="searchedOffers.length > 0"
            :sort-mode="query.sortMode"
            @sort="setSortedQueryParams"
          />
        </div>
      </div>

      <div class="flex flex-row my-5 gap-5">
        <div
          v-if="searchedOffers.length > 0"
          :class="
            query.viewMode === 'map'
              ? 'hidden 2xl:block'
              : 'lg:basis-1/4 hidden lg:block'
          "
        >
          <FilterArea
            :key="filterResetKey"
            v-model:is-initailized="searchIsInitialized"
            :include-non-suitable="query.inclNoSuitable"
            :categories="query.cat"
            :cities="query.cities"
            :tenants="query.tenants"
            :distance="query.distance"
            :price="query.price"
            :only-public-events="query.pubEv"
            :only-registration-needed-events="query.regEv"
            :custom-fields="query.customFields"
            :bookables="searchedOffers"
            @filter="setFilterQueryParams"
          />
        </div>

        <div
          :class="
            searchedOffers.length === 0
              ? 'basis-full '
              : query.viewMode === 'map'
                ? 'basis-full'
                : 'basis-full lg:basis-3/4'
          "
        >
          <div v-if="!sortedOffers.length" class="text-center mt-10 lg:mt-25">
            <UIcon
              size="48"
              name="i-lucide-search-x"
              class="text-gray-400 mb-4"
            />
            <p class="text-gray-500">{{ $t("results.noOffers") }}</p>
          </div>
          <ResultsList
            v-if="currentView === 'list' && sortedOffers.length > 0"
            :bookables="sortedOffers"
            include-non-bookable
            :include-non-suitable="query.inclNoSuitable"
            class="hidden md:block"
          />
          <ResultsGrid
            v-if="currentView === 'list' && sortedOffers.length > 0"
            :bookables="sortedOffers"
            include-non-bookable
            :include-non-suitable="query.inclNoSuitable"
            class="md:hidden"
          />

          <ResultsMap
            v-if="currentView === 'map' && sortedOffers.length > 0"
            :bookables="sortedOffers"
            :include-non-suitable="query.inclNoSuitable"
            :suitable-count="suitableCount"
          >
            <template #filter>
              <FilterButton
                v-model:is-initailized="searchIsInitialized"
                :bookables="searchedOffers"
                :include-non-suitable="query.inclNoSuitable"
                :categories="query.cat"
                :cities="query.cities"
                :tenants="query.tenants"
                :distance="query.distance"
                :price="query.price"
                :only-public-events="query.pubEv"
                :only-registration-needed-events="query.regEv"
                :custom-fields="query.customFields"
                class="shadow-md glass rounded-xl"
                @filter="setFilterQueryParams"
              />
            </template>
          </ResultsMap>
        </div>
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
import CatalogBreadcrumb from "~/components/navigation/CatalogBreadcrumb.vue";

const props = defineProps({
  offers: {
    type: Array,
    required: true,
  },
});

const sourceItems = computed(() => props.offers);

const {
  query,
  searchIsInitialized,
  filterResetKey,
  updatedItems: searchedOffers,
  sortedItems: sortedOffers,
  suitableCount,
  setFilterQueryParams,
  setSortedQueryParams,
  setViewQueryParams,
  runSearch,
  resetResults,
} = useBookableSearch({ sourceItems });

const currentView = ref(query.viewMode);
</script>
<style scoped></style>
