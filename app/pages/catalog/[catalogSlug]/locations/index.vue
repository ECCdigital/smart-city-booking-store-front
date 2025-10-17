<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useBookableStore } from "~~/stores/bookable";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../../../components/search/BookableResultsList.vue";
import { useBookables } from "../../../../composables/api/useBookables.js";

definePageMeta({ name: "catalog-locations" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

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

function testFunction() {
  console.log("coming soon...");
}
</script>

<template>
  <div>
    <div class="bg-green-300 flex justify-center">
      <BookableSearchBar @search="onSearch" />
    </div>

    <BookableResultsList
      :bookables="filteredLocations"
      @filter="testFunction"
      @sort="testFunction"
    />
  </div>
</template>

<style></style>
