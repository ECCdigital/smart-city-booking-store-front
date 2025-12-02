<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import SearchBar from "../../components/search/SearchBar.vue";
import SortButton from "../../components/search/SortButton.vue";
import FilterButton from "../../components/search/FilterButton.vue";
import FilterArea from "~/components/search/FilterArea.vue";
import ResultsList from "~/components/search/ResultsList.vue";
import ResultsGrid from "~/components/search/ResultsGrid.vue";

definePageMeta({
  name: "catalog-bookables",
  layout: "catalog",
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();
await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allResources = computed(() => {
  return bookableStore.getResources;
});
const updatedResources = ref([]);

const filteredIds = ref([]);
const filteredResources = computed(() =>
  updatedResources.value.filter((r) =>
    filterIsActive.value ? filteredIds.value.includes(r.item.id) : true,
  ),
);
const filterIsActive = ref(false);
const filterResetKey = ref(0);

const sortedIds = ref([]);
const sortedResources = computed(() => {
  if (sortedIds.value.length === 0) {
    return filteredResources.value;
  }
  const sortedResults = [];
  sortedIds.value.forEach((id) => {
    const resource = filteredResources.value.find((r) => r.item.id === id);
    if (resource) {
      sortedResults.push(resource);
    }
  });
  return sortedResults;
});

// Initialization: Show all items before the first search
function initializeResults() {
  // Set status: Bookable -> "suitable", others -> "nonBookable"
  updatedResources.value = allResources.value.map((resource) => {
    if (resource.isBookable) {
      return { item: resource, status: "suitable", calculatedPrice: null };
    }
    return { item: resource, status: "nonBookable", calculatedPrice: null };
  });
}

//Stay reactive in case the store loads data later.
watch(
  () => allResources.value,
  (val) => {
    if (!val || val.length === 0) {
      updatedResources.value = [];
      return;
    }
    // Only initialize if no status exists yet (i.e., no search has been performed yet)
    const hasStatus = updatedResources.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true },
);

//Search
const searchIsInitialized = ref(false);
async function onSearch(items) {
  updatedResources.value = items;
}
function numberOfSuitableBookables() {
  return filteredResources.value.filter((r) => r.status === "suitable").length;
}

//Sort & Filter
function setFilteredResources({ isActiv, items }) {
  filterIsActive.value = isActiv;
  if (items) {
    filteredIds.value = items.map((r) => r.item.id);
  }
}
function setSortedResources(resources) {
  sortedIds.value = resources.map((l) => l.item.id);
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
          v-if="updatedResources.length > 0"
          :items-to-sort="filteredResources"
          @sort="setSortedResources"
        />
        <FilterButton
          v-if="updatedResources.length > 0"
          v-model:is-initailized="searchIsInitialized"
          :bookables="updatedResources"
          class="lg:hidden"
          @filter="setFilteredResources"
        />
      </div>
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <div class="lg:basis-1/4 hidden lg:block">
        <FilterArea
          v-if="updatedResources.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="updatedResources"
          @filter="setFilteredResources"
        />
      </div>

      <div class="basis-full lg:basis-3/4">
        <div
          v-if="filteredResources.length === 0"
          class="w-full text-center mt-10"
        >
          <UIcon
            size="48"
            name="i-lucide-monitor-off"
            class="text-gray-400 mb-4"
          />
          <p class="text-gray-500">Keine passenden Ressourcen.</p>
        </div>

        <ResultsList
          v-if="sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="hidden md:block"
        />
        <ResultsGrid
          v-if="sortedResources.length > 0"
          :bookables="sortedResources"
          include-non-bookable
          include-non-suitable
          class="md:hidden"
        />
      </div>
    </div>
  </div>
</template>
