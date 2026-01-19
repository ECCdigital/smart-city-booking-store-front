<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="flex justify-center ">
      <SearchBar
          :location="query.location"
          :term="query.term"
          :time-end="query.end"
          :time-start="query.start"
          entry-page-mode
          @search="goToListview"
      />
    </div>

    <!-- Main Categories -->
    <div class="">
      <MainCategoryArea />
    </div>

    <div class="bg-gray-200 dark:bg-gray-950">
      <LatestEventsArea v-if="allEvents" :items="allEvents" />
    </div>
  </div>
</template>

<script setup>
import SearchBar from "~/components/search/SearchBar.vue";
import {useEventStore} from "~~/stores/event.js";
import MainCategoryArea from "~/components/MainCategoryArea.vue";
import LatestEventsArea from "~/components/LatestEventsArea.vue";
import {useCatalogQueryState} from "~/composables/search/useCatalogQueryState.js";


definePageMeta({
  layout: "entry",
  middleware: ["catalog-auth"],
});

const { tenantTo } = useTenantRoute();

const {loadBundle} = useCatalogBundle();
const eventStore = useEventStore();
await loadBundle({include: ["bookables", "events"]});


const allEvents = computed(() => {
  return eventStore.getEvents
})


const { state: query } = useCatalogQueryState();
async function goToListview(searchParams) {
  const router = useRouter();
  const route = useRoute();

  if(searchParams.term){
    route.query.q = searchParams.term;
  }
  if(searchParams.location){
    route.query.loc = searchParams.location;
  }
  if(searchParams.timeStart){
    route.query.start = searchParams.timeStart;
  }
  if(searchParams.timeEnd){
    route.query.end = searchParams.timeEnd;
  }

  if (searchParams.searchType === "bookables") {
    console.log("go to bookables");
    await router.push(tenantTo(`bookables`));
  } else if (searchParams.searchType === "events") {
    console.log("go to events");
    await router.push(tenantTo(`events`));
  }
}

</script>

<style scoped></style>
