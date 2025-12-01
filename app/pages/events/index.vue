<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import SearchBar from "~/components/search/SearchBar.vue";
import FilterButton from "~/components/search/FilterButton.vue";
import SortButton from "~/components/search/SortButton.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";
import FilterArea from "~/components/search/FilterArea.vue";

definePageMeta({ name: "catalog-events", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();

const eventStore = useEventStore();
await loadBundle({ catalogSlug, include: ["events"] });

const allEvents = computed(() => {
  return eventStore.getEvents;
});
const filteredEvents = ref([]);
const filteredResultEvents = ref([]);
const filterResetKey = ref(0);

// Initialization: Show all items before the first search
function initializeResults() {
  // Set status: Bookable -> "suitable", others -> "nonBookable"
  const withStatus = allEvents.value.map((event) => {
    if (event.attendees.publicEvent === true) {
      return { item: event, status: "suitable", calculatedPrice: null };
    }
    return { item: event, status: "nonBookable", calculatedPrice: null };
  });

  filteredEvents.value = withStatus;
  filteredResultEvents.value = withStatus;
}
//Stay reactive in case the store loads data later.
watch(
  () => allEvents.value,
  (val) => {
    if (!val || val.length === 0) {
      filteredEvents.value = [];
      filteredResultEvents.value = [];
      return;
    }
    // Only initialize if no status exists yet (i.e., no search has been performed yet)
    const hasStatus = filteredEvents.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true },
);

//Search
const searchIsInitialized = ref(false);
function onSearch(items) {
  filteredEvents.value = items;
  filteredResultEvents.value = items;
}
function numberOfSuitableBookables() {
  return filteredResultEvents.value.filter((e) => e.status === "suitable")
    .length;
}

//Sort & Filter
function setSortedEvents(events) {
  filteredResultEvents.value = events;
}
function setFilteredEvents(events) {
  filteredResultEvents.value = events;
}
</script>

<template>
  <div>
    <div class="flex justify-center">
      <SearchBar
        v-model:is-initailized="searchIsInitialized"
        v-model:filter-reset-key="filterResetKey"
        :items-to-search="allEvents"
        is-event
        @initialize="initializeResults"
        @search="onSearch"
      />
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
          v-if="filteredEvents.length > 0"
          :items-to-sort="filteredResultEvents"
          is-event
          @sort="setSortedEvents"
        />
        <FilterButton
          v-if="filteredEvents.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredEvents"
          is-event
          class="lg:hidden"
          @filter="setFilteredEvents"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div class="md:basis-1/4 hidden md:block">
        <FilterArea
          v-if="filteredEvents.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredEvents"
          is-event
          @filter="setFilteredEvents"
        />
      </div>

      <div class="md:basis-3/4">
        <ResultsList
          :bookables="filteredResultEvents"
          include-non-bookable
          include-non-suitable
          is-event-list
          class="hidden md:block"
        />
        <ResultsGrid
          :bookables="filteredResultEvents"
          include-non-bookable
          include-non-suitable
          is-event-grid
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>
