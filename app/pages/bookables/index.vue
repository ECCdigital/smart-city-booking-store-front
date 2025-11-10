<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useBreakpointCheck } from "../../composables/utils/useBreakpointCheck.js";
import BookableSearchBar from "../../components/search/BookableSearchBar.vue";
import SortButton from "../../components/search/SortButton.vue";
import FilterButton from "../../components/search/FilterButton.vue";
import Fuse from "fuse.js";
import { useBookables } from "../../composables/api/useBookables.js";
import FilterArea from "~/components/search/FilterArea.vue";
import BookableResultsList from "~/components/search/BookableResultsList.vue";
import BookableResultsGrid from "~/components/search/BookableResultsGrid.vue";

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
      return { bookable: resource, status: "suitable", calculatedPrice: null };
    }
    return { bookable: resource, status: "nonBookable", calculatedPrice: null };
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
const searchTermOptions = {
  keys: [
    "bookable.title",
    "bookable.description",
    "bookable.flags",
    "bookable.tags",
  ],
  includeScore: true,
  shouldSort: true,
};
const searchLocationOptions = {
  keys: ["bookable.description", "bookable.location"],
  includeScore: true,
  shouldSort: true,
};

async function onSearch({ term, location, timePeriod }) {
  const hasCriteria = !!(
    term ||
    location ||
    (timePeriod && (timePeriod.startDate || timePeriod.endDate))
  );
  const resourcesWithStatus = allResources.value.map((resource) => {
    if (resource.isBookable) {
      return { bookable: resource, status: "isBookable" };
    } else {
      return { bookable: resource, status: "nonBookable" };
    }
  });

  if (!hasCriteria) {
    initializeResults();
    filterResetKey.value++;
    return;
  }

  //alle die status === isBookable haben in Suche einbeziehen
  let bookableResources = resourcesWithStatus.filter(
    (r) => r.status === "isBookable",
  );

  //nach Suchbegriff suchen
  if (term) {
    bookableResources = new Fuse(bookableResources, searchTermOptions)
      .search(term)
      .map((result) => result.item);
  }

  //nach Ort suchen
  if (location) {
    bookableResources = new Fuse(bookableResources, searchLocationOptions)
      .search(location)
      .map((result) => result.item);
  }
  //nach Zeit suchen
  let formatedTimePeriod = null;
  if (timePeriod && timePeriod.startDate) {
    formatedTimePeriod = formateTimePeriod(timePeriod);

    const availabilityChecks = await Promise.all(
      bookableResources.map(async (resource) => {
        const availability = await useBookables().getBookableAvailability(
          resource.bookable.tenantId,
          resource.bookable.id,
          formatedTimePeriod.start.getTime(),
          formatedTimePeriod.end.getTime(),
        );

        return {
          resource,
          isAvailable: availability.isAvailable && availability.remaining > 0,
        };
      }),
    );

    bookableResources = availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.resource);
  }

  //Status updaten
  const updatedResource = await Promise.all(
    resourcesWithStatus.map(async (item) => {
      if (item.status === "isBookable") {
        const isSuitable = bookableResources.includes(item);

        let price = null;
        if (timePeriod) {
          //Preis raussuchen und mit ins Objekt schreiben
          price = await useBookables().getBookablePrice(
            item.bookable.tenantId,
            item.bookable.id,
            formatedTimePeriod.start.getTime(),
            formatedTimePeriod.end.getTime(),
          );
        }

        return {
          ...item,
          status: isSuitable ? "suitable" : "nonSuitable",
          calculatedPrice: isSuitable ? price : null,
        };
      } else {
        return {
          ...item,
          status: "nonBookable",
          calculatedPrice: null,
        };
      }
    }),
  );
  filteredResources.value = updatedResource;
  filteredResultResources.value = filteredResources.value;

  //Filter zurücksetzen
  filterResetKey.value++;
}

function numberOfSuitableBookables() {
  return filteredResources.value.filter((l) => l.status === "suitable").length;
}

function formateTimePeriod(timePeriod) {
  const newTimePeriod = {};

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
      <BookableSearchBar @search="onSearch" />
    </div>

    <div class="m-10 lg:m-5 sm:flex items-center">
      <span class="text-black dark:text-white lg:font-bold"
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
          :bookables="filteredResources"
          @filter="setFilteredResources"
        />
      </div>

      <div class="md:basis-3/4">
        <BookableResultsList
            v-if="isGreaterThanMd"
            :bookables="filteredResultResources"
            include-non-bookable
            include-non-suitable
        />
        <BookableResultsGrid
            v-else
            :bookables="filteredResultResources"
            include-non-bookable
            include-non-suitable
        />
      </div>
    </div>
  </div>
</template>
