<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import BookableSearchBar from "~/components/search/BookableSearchBar.vue";
import FilterButton from "~/components/search/FilterButton.vue";
import SortButton from "~/components/search/SortButton.vue";
import BookableResultsList from "~/components/search/BookableResultsList.vue";
import BookableResultsGrid from "~/components/search/BookableResultsGrid.vue";
import FilterArea from "~/components/search/FilterArea.vue";

definePageMeta({ name: "catalog-events", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
const { loadBundle } = useCatalogBundle();

const eventStore = useEventStore();
await loadBundle({ catalogSlug, include: ["events"] });

//const { events } = storeToRefs(eventStore);

const allEvents = computed(() => {
  return eventStore.getEvents;
});
const filteredEvents = ref(allEvents.value); //ref([]);
const filteredResultEvents = ref(filteredEvents.value); //ref([]);
//const filterResetKey = ref(0);

const sortMode = ref("relevance");

function onSearch() {
  console.log("Search triggered");
  // toDo - Implement search logic here
}
function setFilteredEvents(events) {
  filteredResultEvents.value = events;
}
function sortBookables(mode) {
  console.log("Sort mode:", mode);
  // toDo - Implement sorting logic here
}
function numberOfSuitableBookables() {
  return filteredEvents.value.length; //toDo - ANPASSEN!!!
  //return filteredEvents.value.filter((l) => l.status === "suitable").length;
}
</script>

<template>
  <div>
    <div class="flex justify-center">
      <BookableSearchBar @search="onSearch" />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span class="text-black dark:text-white lg:font-bold"
        >{{ numberOfSuitableBookables() }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="filteredEvents.length > 0"
          :sort-mode="sortMode"
          @sort="sortBookables"
        />
        <FilterButton
          v-if="filteredEvents.length > 0"
          :bookables="filteredEvents"
          class="lg:hidden"
          @filter="setFilteredEvents"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="md:basis-1/4">
        <FilterArea
          v-if="filteredEvents.length > 0"
          :key="filterResetKey"
          :bookables="filteredEvents"
          @filter="setFilteredEvents"
        />
      </div>

      <div class="md:basis-3/4">
        <BookableResultsList
            v-if="isGreaterThanMd"
            :bookables="filteredResultEvents"
            include-non-bookable
            include-non-suitable
            is-event-list
        />
        <BookableResultsGrid
            v-else
            :bookables="filteredResultEvents"
            include-non-bookable
            include-non-suitable
            is-event-grid
        />
      </div>

      <!--
      <div class=bg-yellow-300>
       <ol>
         <li v-for="(event, index) in filteredResultEvents" :key="index">
           - {{index}}.){{ event }}
         </li>
       </ol>
      </div>
      -->
    </div>
  </div>
</template>
