<template>
  <div class="container bg-neutral-50 dark:bg-gray-950">
    <div class="relative h-0 bg-transparent">
      <div class="flex justify-center">
        <SearchBar
          :location="query.location"
          :distance="query.distance"
          :term="query.term"
          :time-end="query.end"
          :time-start="query.start"
          entry-page-mode
          @search="goToListview"
        />
      </div>
    </div>

    <!-- Main Categories -->
    <div class="pt-20 sm:pt-25 md:pt-10 bg-neutral-50 dark:bg-gray-950">
      <MainCategoryArea />
    </div>

    <div class="bg-neutral-50 dark:bg-gray-950">
      <LatestEventsArea v-if="allEvents.length > 0" :items="allEvents" />
    </div>
  </div>
</template>

<script setup>
import SearchBar from "~/components/search/SearchBar.vue";
import { useEventStore } from "~~/stores/event.js";
import MainCategoryArea from "~/components/MainCategoryArea.vue";
import LatestEventsArea from "~/components/LatestEventsArea.vue";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth", "catalog-guard"],
  hero: {
    height: "xl",
    titleClass: "text-2xl",
    subtitleClass: "text-5xl",
    showOnMobile: true,
  },
});

const { tenantTo } = useTenantRoute();

const { loadBundle } = useCatalogBundle();
const eventStore = useEventStore();
await loadBundle({ include: ["bookables", "events"] });

const allEvents = computed(() => {
  return eventStore.getEvents;
});

const { state: query } = useCatalogQueryState();
async function goToListview(searchParams) {
  const router = useRouter();
  const route = useRoute();

  if (searchParams.term) {
    route.query.q = searchParams.term;
  }

  if (searchParams.location && typeof searchParams.location === "object") {
    route.query.loc = searchParams.location.display_address
  } else if(searchParams.location && typeof searchParams.location === "string") {
    route.query.loc = searchParams.location;
  }

  if(searchParams.distance) {
    route.query.dist = searchParams.distance;
  }
  if (searchParams.timeStart) {
    route.query.start = searchParams.timeStart;
  }
  if (searchParams.timeEnd) {
    route.query.end = searchParams.timeEnd;
  }

  if (searchParams.searchType === "bookables") {
    await router.push(tenantTo(`bookables`));
  } else if (searchParams.searchType === "events") {
    await router.push(tenantTo(`events`));
  }
}
</script>

<style scoped></style>
