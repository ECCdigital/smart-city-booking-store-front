<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="flex justify-center bg-gray-200 dark:bg-gray-950">
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

    <div class="bg-gray-200 dark:bg-gray-950">
      <div
class="grid md:grid-cols-2 lg:flex justify-self-center space-x-3"
           style="max-width: 90vw; margin: auto; padding: 50px 0">
        <div
            v-for="(category,i) in tempCategories"
            :key="i"
            class="rounded-b-xl p-5"
            style="width: 400px"
        >
          <UCard
              class="mainCategoryCard h-full bg-white dark:bg-gray-700 text-black dark:text-gray-200 shadow-lg  hover:scale-125 hover:border-3 hover:-m-3 hover:border-primary"
              variant="solid"

          >
            <template #header>
              <div class="w-full flex justify-center mt-5">
                <div class="bg-primary rounded-full p-3 pb-1 shadow-lg avatar-hover">
                  <UIcon :name="category.icon" :style="{color: contrastToPrimary}" class="avatar-hover" size="24"/>
                </div>
              </div>
            </template>
            <div class="text-center -mt-5 space-y-1">
              <p class="text-xl font-bold">{{ category.title }}</p>
              <p>{{ category.description }}</p>
            </div>
          </UCard>
        </div>
      </div>
    </div>
    <div class="flex flex-row justify-center mb-10 lg:my-5 m-5">
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
  </div>
</template>

<script setup>
import {useBookableSearch} from "~/composables/search/useBookableSearch.js";
import SearchBar from "~/components/search/SearchBar.vue";
import {useBookableStore} from "~~/stores/bookable.js";
import {useEventStore} from "~~/stores/event.js";
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";


definePageMeta({
  layout: "entry",
  middleware: ["catalog-auth"],
});

const contrastToPrimary = computed(() => {
      return useContrastColor().contrastToPrimary()
    }
);
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
  updatedItems: searchedItems,
  runSearch,
  resetResults
} = useBookableSearch({isEvent: false, sourceItems: allItems});

const suitableItems = computed(() => {
  return searchedItems.value.filter((i) => i.status === "suitable");
});
//toDo - read categories from instance settings
const tempCategories = [
  {
    value: "location",
    title: "Veranstaltungsorte",
    description: "Veranstaltungatsorte in Ihrer Nähe",
    icon: "i-lucide-building-2"
  },
  {
    value: "room",
    title: "Räume",
    description: "Co-Working Spaces, Seminarräume u.v.m.",
    icon: "i-lucide-door-open"
  },
  {
    value: "resource",
    title: "Geräte & Fahrzeuge",
    description: "Technik, Fahrzeuge & mehr mieten",
    icon: "i-lucide-wrench"
  },
  {
    value: "event",
    title: "Veranstaltungen",
    description: "Events & Kurse in Ihrer Nähe",
    icon: "i-lucide-calendar-check-2"
  }
]

function updateBookables(itemList, itemName) {
  return itemList.filter((i) => i.isBookable).map((i) => {
    return {
      ...i,
      category: itemName
    }
  });
}

</script>

<style scoped>
:deep(.mainCategoryCard:hover .avatar-hover) {
  transform: scale(1.15);
  transition: transform 0.2s;
  rotate: 2deg;
}

</style>
