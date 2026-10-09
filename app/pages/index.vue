<template>
  <!-- Surface is full-bleed, content sits inside the page container -->
  <div class="bg-neutral-50 dark:bg-gray-950">
    <div class="container">
      <div class="relative h-0 bg-transparent">
        <div class="flex justify-center mt-12 md:mt-0">
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
      <div class="pt-20 sm:pt-25 md:pt-10">
        <MainCategoryArea />
      </div>

      <!-- A failed load is not an empty catalog -->
      <UAlert
        v-if="error"
        class="my-6"
        color="error"
        variant="subtle"
        icon="i-lucide-triangle-alert"
        :title="$t('errors.loadFailed.title')"
        :description="$t('errors.loadFailed.message')"
      />
      <LatestEventsArea v-else-if="allEvents.length > 0" :items="allEvents" />

      <HowBookingWorksArea />
    </div>
  </div>
</template>

<script setup>
import SearchBar from "~/components/search/SearchBar.vue";
import { useEventStore } from "~~/stores/event.js";
import MainCategoryArea from "~/components/MainCategoryArea.vue";
import LatestEventsArea from "~/components/LatestEventsArea.vue";
import HowBookingWorksArea from "~/components/home/HowBookingWorksArea.vue";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";
import { isTenantNotAvailable } from "~/utils/tenantHome.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth", "catalog-guard"],
  hero: "home",
});

usePageTitle();

const route = useRoute();
const { tenantTo } = useTenantRoute();
const { loadBundle } = useCatalogBundle();
const eventStore = useEventStore();
const { tenantID } = useTenant();

const catalogSlug = computed(() => route.params.catalogSlug || null);

// A tenant that is not available (missing, declined, pending approval) is
// the neutral 404 page, with HTTP 404 on SSR; any other failure stays the
// load error below.
const { error } = useLazyAsyncData("catalog-bundle-home", (nuxtApp) =>
  loadBundle({ slug: catalogSlug.value, include: ["events"] }).catch(
    (failure) => {
      if (isTenantNotAvailable({ tenantID: tenantID.value, error: failure })) {
        nuxtApp.runWithContext(() =>
          showError({ statusCode: 404, statusMessage: "Page Not Found" }),
        );
      }
      throw failure;
    },
  ),
);

watch(
  error,
  (failure) => {
    if (failure) console.error("[index] loadBundle failed:", failure);
  },
  { immediate: true },
);

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
  } else if (
    searchParams.location &&
    typeof searchParams.location === "string"
  ) {
    query.loc = searchParams.location;
  }

  await router.push({
    ...tenantTo("search"),
    query,
  });
}
</script>

<style scoped></style>
