<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useBookableStore } from "~~/stores/bookable";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../../../components/search/BookableResultsList.vue";

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
  //toDo - was noch???
  includeScore: true,
  shouldSort: true,
};
const searchLocationOptions = {
  keys: ["description", "location"], //toDo - was noch???
  includeScore: true,
  shouldSort: true,
};

function onSearch({ term, location, timePeriod }) {
  let locations = allLocations.value;
  if (term) {
    locations = new Fuse(locations, searchTermOptions)
      .search(term)
      .map((result) => result.item);
  }
  if (location) {
    locations = new Fuse(locations, searchLocationOptions)
      .search(location)
      .map((result) => result.item);
  }
  if (timePeriod) {
    console.log("want so search for time, too... ");
  }
  filteredLocations.value = locations;
}

function testFunction() {
  console.log("coming soon...");
}
</script>

<template>
  <div>
    <BookableSearchBar @search="onSearch" />

    <BookableResultsList
      :bookables="filteredLocations"
      @filter="testFunction"
      @sort="testFunction"
    />
  </div>
</template>

<style></style>
