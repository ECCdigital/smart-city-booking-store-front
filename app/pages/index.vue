<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="flex justify-center ">
      <SearchBar
          :location="query.location"
          :term="query.term"
          :time-end="query.end"
          :time-start="query.start"
          entry-page-mode
          @reset="resetResults"
          @search="runSearch"
      />
    </div>

    <!-- Main Categories -->
    <div class="">
      <MainCategoryArea />
    </div>

    <!-- Results -->
    <div v-if="searchIsInitialized" class="flex flex-row justify-center mb-10 lg:my-5 m-5">
      <div class="basis-full lg:basis-3/4">
        <ResultsList
            v-if="suitableItems.length > 0"
            :bookables="suitableItems"
            entry-page-mode
            class="hidden md:block"
        />
        <ResultsGrid
            v-if="suitableItems.length > 0"
            :bookables="suitableItems"
            entry-page-mode
            class="md:hidden"
        />
      </div>
    </div>

    <div :class="searchIsInitialized? 'bg-gray-200 dark:bg-gray-950' : ''">
      <LatestEventsArea v-if="searchedItems" :items="searchedItems" />
    </div>
  </div>
</template>

<script setup>
import {useBookableSearch} from "~/composables/search/useBookableSearch.js";
import SearchBar from "~/components/search/SearchBar.vue";
import {useBookableStore} from "~~/stores/bookable.js";
import {useEventStore} from "~~/stores/event.js";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";
import MainCategoryArea from "~/components/MainCategoryArea.vue";
import LatestEventsArea from "~/components/LatestEventsArea.vue";


definePageMeta({
  layout: "entry",
  middleware: ["catalog-auth"],
});

const {loadBundle} = useCatalogBundle();
const bookableStore = useBookableStore();
const eventStore = useEventStore();
await loadBundle({include: ["bookables", "events"]});

const allItems = computed(() => {
  const locations = updateBookables(bookableStore.getLocations, "location")
  const rooms = updateBookables(bookableStore.getRooms, "room")
  const resources = updateBookables(bookableStore.getResources, "resource")

  const events = eventStore.getEvents.map((e) => {
    return {
      ...e,
      category: "event"
    }
  });
  return locations.concat(rooms).concat(resources).concat(events);
});

const {
  query,
  searchIsInitialized,
  updatedItems: searchedItems,
  runSearch,
  resetResults
} = useBookableSearch({isEvent: false, sourceItems: allItems});

const suitableItems = computed(() => {
  return searchedItems.value.filter((i) => i.status === "suitable");
});

function updateBookables(itemList, itemName) {
  return itemList.filter((i) => i.isBookable).map((i) => {
    return {
      ...i,
      category: itemName
    }
  });
}

</script>

<style scoped></style>
