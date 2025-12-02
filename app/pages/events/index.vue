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

const { loadBundle } = useCatalogBundle();

const eventStore = useEventStore();
await loadBundle({ include: ["events"] });

const allEvents = computed(() => {
  return eventStore.getEvents;
});
const updatedEvents = ref([]);

const filteredIds = ref([]);
const filteredEvents = computed(() =>
  updatedEvents.value.filter((e) =>
    filterIsActive.value ? filteredIds.value.includes(e.item.id) : true,
  ),
);
const filterIsActive = ref(false);
const filterResetKey = ref(0);

const sortedIds = ref([]);
const sortedEvents = computed(() => {
  if (sortedIds.value.length === 0) {
    return filteredEvents.value;
  }
  const sortedResults = [];
  sortedIds.value.forEach((id) => {
    const event = filteredEvents.value.find((e) => e.item.id === id);
    if (event) {
      sortedResults.push(event);
    }
  });
  return sortedResults;
});

// Initialization: Show all items before the first search
function initializeResults() {
  // Set status: Bookable -> "suitable", others -> "nonBookable"
  updatedEvents.value = allEvents.value.map((event) => {
    if (event.attendees.publicEvent === true) {
      return { item: event, status: "suitable", calculatedPrice: null };
    }
    return { item: event, status: "nonBookable", calculatedPrice: null };
  });
}
//Stay reactive in case the store loads data later.
watch(
  () => allEvents.value,
  (val) => {
    if (!val || val.length === 0) {
      updatedEvents.value = [];
      return;
    }
    // Only initialize if no status exists yet (i.e., no search has been performed yet)
    const hasStatus = updatedEvents.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true }
);

//Search
const searchIsInitialized = ref(false);
function onSearch(items) {
  updatedEvents.value = items;
}
function numberOfSuitableBookables() {
  return filteredEvents.value.filter((e) => e.status === "suitable").length;
}

//Sort & Filter
function setFilteredEvents({ isActiv, items }) {
  filterIsActive.value = isActiv;
  if (items) {
    filteredIds.value = items.map((e) => e.item.id);
  }
}
function setSortedEvents(events) {
  sortedIds.value = events.map((e) => e.item.id);
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
          v-if="updatedEvents.length > 0"
          :items-to-sort="filteredEvents"
          is-event
          @sort="setSortedEvents"
        />
        <FilterButton
          v-if="updatedEvents.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="updatedEvents"
          is-event
          class="lg:hidden"
          @filter="setFilteredEvents"
        />
      </div>
    </div>

    <div v-if="!updatedEvents.length" class="text-center mt-10">
      <UIcon
        size="48"
        name="i-lucide-calendar-off"
        class="text-gray-400 mb-4"
      />
      <p class="text-gray-500">{{ $t("events.noEvents") }}</p>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div class="lg:basis-1/4 hidden lg:block">
        <FilterArea
          v-if="updatedEvents.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="updatedEvents"
          is-event
          @filter="setFilteredEvents"
        />
      </div>

      <div class="basis-full lg:basis-3/4">
        <div
          v-if="filteredEvents.length === 0"
          class="w-full text-center mt-10"
        >
          <UIcon
            size="48"
            name="i-lucide-monitor-off"
            class="text-gray-400 mb-4"
          />
          <p class="text-gray-500">Keine passenden Events.</p>
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
