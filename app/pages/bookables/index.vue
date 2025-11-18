<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
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

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();
await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allResources = computed(() => {
  //return bookableStore.getBookables;
  return bookableStore.getResources;
});
const filteredResources = ref([]);
const filteredResultResources = ref([]);
const filterResetKey = ref(0);

// Initialisierung: Vor der ersten Suche alles anzeigen
function initializeResults() {
  // Status setzen: Buchbare -> "suitable", andere -> "nonBookable"
  const withStatus = allResources.value.map((resource) => {
    if (resource.isBookable) {
      return { item: resource, status: "suitable", calculatedPrice: null };
    }
    return { item: resource, status: "nonBookable", calculatedPrice: null };
  });
  filteredResources.value = withStatus;
  filteredResultResources.value = withStatus;
}

// Reaktiv bleiben, falls der Store später Daten nachlädt
watch(
  () => allResources.value,
  (val) => {
    if (!val || val.length === 0) {
      filteredResources.value = [];
      filteredResultResources.value = [];
      return;
    }
    // Nur initialisieren, wenn noch kein Status existiert (d.h. noch keine Suche)
    const hasStatus = filteredResources.value.some((b) => b?.status);
    if (!hasStatus) {
      initializeResults();
    }
  },
  { immediate: true, deep: true },
);

const sortMode = ref("relevance");

//Search
const searchIsInitialized = ref(false);

async function onSearch(resourcesArray) {
  filteredResources.value = resourcesArray;
  filteredResultResources.value = resourcesArray;
}

function numberOfSuitableBookables() {
  return filteredResources.value.filter((l) => l.status === "suitable").length;
}

function sortBookables(mode) {
  sortMode.value = mode;
  //Default: momentan "Relevanz" nach Fuze-Suche...
  filteredResources.value = filteredResources.value.sort((a, b) => {
    //Sortieren nach Preis
    if (mode === "priceAscending" || mode === "priceDescending") {
      // Null-Preise sollen immer am Ende sein
      if (a.calculatedPrice === null) return 1;
      if (b.calculatedPrice === null) return -1;

      //toDo - Option für User-Preis berücksichtigen...
      if (mode === "priceAscending") {
        return (
          a.calculatedPrice.regularPriceEur - b.calculatedPrice.regularPriceEur
        );
      } else if (mode === "priceDescending") {
        return (
          b.calculatedPrice.regularPriceEur - a.calculatedPrice.regularPriceEur
        );
      } else {
        return 0;
      }
    }

    //Sortieren nach Distanz - toDo - Entfernung berechnen
    if (mode === "distanceAscending" || mode === "distanceDescending") {
      // Momentan keine Entfernung vorhanden, also keine Sortierung
      /*
      if (mode === "distanceAscending") {
        return a.calculatedDistance - b.calculatedDistance;
      } else if (mode === "distanceDescending") {
        return b.calculatedDistance - a.calculatedDistance;
      } else {
        return 0;
      }
      */
      return 0;
    }
  });
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
          :sort-mode="sortMode"
          @sort="sortBookables"
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

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="md:basis-1/4">
        <FilterArea
          v-if="filteredResources.length > 0"
          :key="filterResetKey"
          v-model:is-initailized="searchIsInitialized"
          :bookables="filteredResources"
          @filter="setFilteredResources"
        />
      </div>

      <div class="md:basis-3/4">
        <ResultsList
          v-if="isGreaterThanMd"
          :bookables="filteredResultResources"
          include-non-bookable
          include-non-suitable
        />
        <ResultsGrid
          v-else
          :bookables="filteredResultResources"
          include-non-bookable
          include-non-suitable
        />
      </div>
    </div>
  </div>
</template>
