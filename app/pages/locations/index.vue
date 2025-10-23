<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../components/search/BookableResultsList.vue";
import { useBookables } from "~/composables/api/useBookables.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import BookableResultsGrid from "../../components/search/BookableResultsGrid.vue";
import FilterArea from "../../components/search/FilterArea.vue";
import SortButton from "../../components/search/SortButton.vue";

definePageMeta({ name: "catalog-locations", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });
const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());

const allLocations = computed(() => {
  let locations = bookableStore.getLocations;
  return locations.concat(bookableStore.getRooms);
});
const filteredLocations = ref(allLocations.value);
const { bookables } = storeToRefs(bookableStore);

//Search
const searchTermOptions = {
  keys: ["title", "description", "flags", "tags"],
  includeScore: true,
  shouldSort: true,
};
const searchLocationOptions = {
  keys: ["description", "location"],
  includeScore: true,
  shouldSort: true,
};

async function onSearch({ term, location, timePeriod }) {
  //toDo - Suchergebnisse in 1 Array speichern und Status ranheften

  //toDo - vorfiltern und prüfen, was überhaupt buchbar ist

  let locations = allLocations.value;
  //nach Suchbegriff suchen
  if (term) {
    locations = new Fuse(locations, searchTermOptions)
      .search(term)
      .map((result) => result.item);
  }
  //nach Ort suchen
  if (location) {
    locations = new Fuse(locations, searchLocationOptions)
      .search(location)
      .map((result) => result.item);
  }

  //nach Zeit suchen
  if (timePeriod.startDate) {
    const formatedTimePeriod = formateTimePeriod(timePeriod);

    const availabilityChecks = await Promise.all(
      locations.map(async (location) => {
        const availability = await useBookables().getBookableAvailability(
          location.tenantId,
          location.id,
          formatedTimePeriod.start.getTime(),
          formatedTimePeriod.end.getTime(),
        );

        //toDo - wenn "remaining" gefixt, dann ebenfalls berücksichtigen
        return { location, isAvailable: availability.isAvailable };
      }),
    );

    locations = availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.location);
  }
  filteredLocations.value = locations;
}

function formateTimePeriod(timePeriod) {
  let newTimePeriod = {};

  newTimePeriod.start = new Date(
    timePeriod.startDate + " " + timePeriod.startTime,
  );

  newTimePeriod.end = "";
  if (!timePeriod.endDate && timePeriod.endTime) {
    newTimePeriod.end = new Date(
      timePeriod.startDate + " " + timePeriod.endTime,
    );
  } else {
    newTimePeriod.end = new Date(timePeriod.endDate + " " + timePeriod.endTime);
  }
  return newTimePeriod;
}

function sortBookables(mode) {
  console.log("Art der Sortierung: ", mode);
  //toDo - momentan "relevanz" nach Fuze-Suche...
}
function testFunction() {
  console.log("coming soon...");
}
</script>

<template>
  <div>
    <div class="flex justify-center">
      <BookableSearchBar @search="onSearch" />
    </div>

    <div v-if="!isGreaterThanMd" class="flex items-center m-10">
      <span>{{ bookables.length }} passende Ergebnisse</span>
      <div style="flex: 1"></div>
      <SortButton @sort="sortBookables" />
      <UPopover>
        <UButton
          label="Filtern"
          icon="i-lucide-funnel"
          color="neutral"
          variant="soft"
          class="rounded-full py-2 px-3"
          @click="testFunction"
        />
        <template #content>
          <UCard><FilterArea @filter="testFunction" /></UCard>
        </template>
      </UPopover>
    </div>
    <div class="flex flex-row my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="basis-1/4">
        <p class="text-black font-bold">
          {{ filteredLocations.length }} passende Ergebnisse
        </p>
        <SortButton @sort="sortBookables" />
        <FilterArea @filter="testFunction" />
      </div>

      <div :class="isGreaterThanMd ? 'basis-3/4' : ''">
        <BookableResultsList
          v-if="isGreaterThanMd"
          :bookables="filteredLocations"
          @filter="testFunction"
          @sort="testFunction"
        />
        <BookableResultsGrid
          v-else
          :bookables="filteredLocations"
          @filter="testFunction"
          @sort="testFunction"
        />
      </div>
    </div>
  </div>
</template>

<style></style>
