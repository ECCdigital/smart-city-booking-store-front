<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import SearchBar from "~/components/search/SearchBar.vue";
import SortButton from "~/components/search/SortButton.vue";
import FilterButton from "~/components/search/FilterButton.vue";
import FilterArea from "~/components/search/FilterArea.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";

definePageMeta({
  name: "tenant-catalog-bookables",
  layout: "catalog",
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
const tenantID = computed(() => route.params.tenantID);

const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();

await loadBundle({
  tenantID: tenantID.value,
  slug: catalogSlug.value,
  include: ["bookables"],
});
await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allResources = computed(() => {
  const tenantFilter = tenantID.value
    ? (loc) => loc.tenantId === tenantID.value
    : () => true;

  return bookableStore.getResources.filter(tenantFilter);
});
const filteredResources = ref([]);
const filteredResultResources = ref([]);
const filterResetKey = ref(0);

// Initialization: Show all items before the first search
function initializeResults() {
  // Set status: Bookable -> "suitable", others -> "nonBookable"
  const withStatus = allResources.value.map((resource) => {
    if (resource.isBookable) {
      return { item: resource, status: "suitable", calculatedPrice: null };
    }
    return { item: resource, status: "nonBookable", calculatedPrice: null };
  });
  filteredResources.value = withStatus;
  filteredResultResources.value = withStatus;
}

//Stay reactive in case the store loads data later.
watch(
  () => allResources.value,
  (val) => {
    if (!val || val.length === 0) {
      filteredResources.value = [];
      filteredResultResources.value = [];
      return;
    }
    // Only initialize if no status exists yet (i.e., no search has been performed yet)
    const hasStatus = filteredResources.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true }
);

//Search
const searchIsInitialized = ref(false);
const currentSearchParams = ref({});
async function onSearch({ items, searchParams }) {
  filteredResources.value = items;
  filteredResultResources.value = items;
  currentSearchParams.value = searchParams;
}
function numberOfSuitableBookables() {
  return filteredResources.value.filter((l) => l.status === "suitable").length;
}

//Sort & Filter
function setSortedResources(resources) {
  filteredResultResources.value = resources;
}
function setFilteredResources(resources) {
  filteredResultResources.value = resources;
}
</script>

<template>
  <div>
    <div class="flex justify-center">
      <SearchBar
        v-model:is-initailized="searchIsInitialized"
        v-model:filter-reset-key="filterResetKey"
        :items-to-search="allResources"
        @initialize="initializeResults"
        @search="onSearch"
      />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span
        v-if="searchIsInitialized"
        class="text-black dark:text-white lg:font-bold"
        >{{ numberOfSuitableBookables() }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0">
        <SortButton
          v-if="filteredResources.length > 0"
          :items-to-sort="filteredResultResources"
          @sort="setSortedResources"
        />
        <FilterButton
          v-if="filteredResources.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredResources"
          class="lg:hidden"
          @filter="setFilteredResources"
        />
      </div>
    </div>

    <div v-if="!filteredResources.length" class="text-center mt-10">
      <UIcon size="48" name="i-lucide-monitor-off" class="text-gray-400 mb-4" />
      <p class="text-gray-500">{{ $t("resources.noResources") }}</p>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div class="md:basis-1/4 hidden md:block">
        <FilterArea
          v-if="filteredResources.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredResources"
          @filter="setFilteredResources"
        />
      </div>

      <div class="basis-full md:basis-3/4">
        <ResultsList
          v-if="filteredResultResources.length > 0"
          :bookables="filteredResultResources"
          :search-params="currentSearchParams"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="filteredResultResources.length > 0"
          :bookables="filteredResultResources"
          :search-params="currentSearchParams"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>
