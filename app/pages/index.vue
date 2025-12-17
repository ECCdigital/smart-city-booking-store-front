<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="flex justify-center">
      <SearchBar
          entry-page-mode
          :term="query.term"
          :location="query.location"
          :time-start="query.start"
          :time-end="query.end"
          @search="runSearch"
          @reset="resetResults"
      />
    </div>
  </div>
</template>

<script setup>
import {useBookableSearch} from "~/composables/search/useBookableSearch.js";
import SearchBar from "~/components/search/SearchBar.vue";

definePageMeta({
  layout: "entry",
  middleware: ["catalog-auth"],
});

//toDo - *** *** Nutzung von useBookableSearch anpassen *** ***
const {
  query,
  resetResults
} = useBookableSearch({ isEvent: false, sourceItems: [] });

function runSearch() {
  console.log("Help... Don't know what to do here yet.");
  // toDo - *** *** Implement search functionality *** ***
}
</script>

<style scoped></style>
