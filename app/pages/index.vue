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

const { pending, error } = useLazyAsyncData("catalog-bundle", () =>
    loadBundle({ include: ["bookables", "events"] })
);

if (error.value) {
  console.error("[index] loadBundle failed:", error.value);
}

const allEvents = computed(() => eventStore.getEvents);
const { state: query } = useCatalogQueryState();

async function goToListview(searchParams) {
  const router = useRouter();
  const query = {};

  if (searchParams.term) query.q = searchParams.term;
  if (searchParams.distance) query.dist = searchParams.distance;
  if (searchParams.timeStart) query.start = searchParams.timeStart;
  if (searchParams.timeEnd) query.end = searchParams.timeEnd;
  if (searchParams.location && typeof searchParams.location === "object") {
    query.loc = searchParams.location.display_address;
  } else if (searchParams.location && typeof searchParams.location === "string") {
    query.loc = searchParams.location;
  }

  const path =
      searchParams.searchType === "events" ? "events" : "bookables";

  await router.push({
    path: tenantTo(path),
    query,
  });
}
</script>

<style scoped></style>
