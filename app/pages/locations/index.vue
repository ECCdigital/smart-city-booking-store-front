<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../components/search/BookableResultsList.vue";
import { useBookables } from "~/composables/api/useBookables.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import BookableResultsGrid from "../../components/search/BookableResultsGrid.vue";
import FilterArea from "../../components/search/FilterArea.vue";
import SortButton from "../../components/search/SortButton.vue";
import FilterButton from "../../components/search/FilterButton.vue";

definePageMeta({ name: "catalog-locations", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
const { loadBundle } = useCatalogBundle();

const bookableStore = useBookableStore();
await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allLocations = computed(() => {
  const locations = bookableStore.getLocations;
  return locations.concat(bookableStore.getRooms);
});
const filteredLocations = ref(allLocations.value);
const filteredResultLocations = computed(() => {
  let locations = filteredLocations.value;
  if(hideNonSuitable.value){
    console.log("only want suitable locations");
    locations = locations.filter((l) => l.status !== "nonSuitable");
  }
  if(hideNonBookable.value){
    console.log("only want bookable locations");
    locations = locations.filter((l) => l.status !== "nonBookable");
  }
  return locations;
});

const hideNonBookable = ref(false);
const hideNonSuitable = ref(false);


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
  const locationsWithStatus = allLocations.value.map((location) => {
    if (location.isBookable) {
      return { bookable: location, status: "isBookable" };
    } else {
      return { bookable: location, status: "nonBookable" };
    }
  });
  //toDo - wenn "nonBookable" auch noch related bookables prüfen!?
  console.log(locationsWithStatus);

  //alle die status === isBookable haben in Suche einbeziehen
  let bookableLocations = locationsWithStatus.filter(
    (l) => l.status === "isBookable",
  );

  //nach Suchbegriff suchen
  if (term) {
    bookableLocations = new Fuse(bookableLocations, searchTermOptions)
      .search(term)
      .map((result) => result.item);
  }

  //nach Ort suchen
  if (location) {
    bookableLocations = new Fuse(bookableLocations, searchLocationOptions)
      .search(location)
      .map((result) => result.item);
  }

  //nach Zeit suchen
  let formatedTimePeriod = null;
  if (timePeriod && timePeriod.startDate) {
    formatedTimePeriod = formateTimePeriod(timePeriod);

    const availabilityChecks = await Promise.all(
      bookableLocations.map(async (location) => {
        const availability = await useBookables().getBookableAvailability(
          location.bookable.tenantId,
          location.bookable.id,
          formatedTimePeriod.start.getTime(),
          formatedTimePeriod.end.getTime(),
        );

        return { location, isAvailable: availability.isAvailable && availability.remaining > 0 };
      }),
    );

    bookableLocations = availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.location);
  }

  //Status updaten
  const updatedLocations = await Promise.all(
    locationsWithStatus.map(async (item) => {
      if (item.status === "isBookable") {
        const isSuitable = bookableLocations.includes(item);

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
  console.log(updatedLocations);
  filteredLocations.value = updatedLocations;
}
function numberOfSuitableBookables() {
  return filteredLocations.value.filter((l) => l.status === "suitable").length;
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
  sortMode.value = mode
  //Default: momentan "Relevanz" nach Fuze-Suche...
  filteredLocations.value = filteredLocations.value.sort((a, b) => {
    //Sortieren nach Preis
    if (mode === "priceAscending" || mode === "priceDescending") {
      // Null-Preise sollen immer am Ende sein
      if (a.calculatedPrice === null) return 1;
      if (b.calculatedPrice === null) return -1;

      //toDo - Option für User-Preis berücksichtigen...
      if (mode === "priceAscending") {
        return a.calculatedPrice.regularPriceEur - b.calculatedPrice.regularPriceEur;
      } else if (mode === "priceDescending") {
        return b.calculatedPrice.regularPriceEur - a.calculatedPrice.regularPriceEur;
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

function filterBookableLocations(isIncluded) {
  console.log("want to filter for bookable locations: ", isIncluded)
  hideNonBookable.value = !isIncluded;
}
function filterSuitableLocations(isIncluded) {
  console.log("want to filter for suitable locations: ", isIncluded)
  hideNonSuitable.value = !isIncluded;
}

function testFunction() {
  console.log("coming soon...");
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
      <div class="flex space-x-2 mt-2 sm:mt-0 -ml-2 sm:ml-0" >
        <SortButton v-if="filteredLocations.length > 0" :sort-mode="sortMode" @sort="sortBookables" />
        <FilterButton
            v-if="filteredLocations.length > 0"
            class="lg:hidden"
            @filter="testFunction"
        />
        <!-- toDo - add filter function!!!!!!!! -->
      </div>
    </div>


    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="md:basis-1/4">
        <FilterArea
          v-if="filteredLocations.length > 0"
          :bookables="filteredResultLocations"
          @change-bookable-visability="filterBookableLocations"
          @change-suiable-visability="filterSuitableLocations"
          @filter="testFunction"
        />
      </div>

      <div class="md:basis-3/4">
        <BookableResultsList
          v-if="isGreaterThanMd"
          :bookables="filteredResultLocations"
          include-non-bookable
          include-non-suitable
        />
        <BookableResultsGrid
          v-else
          :bookables="filteredResultLocations"
          include-non-bookable
          include-non-suitable
        />
      </div>
    </div>
    <ul class="bg-amber-800">
      <li v-for="(l, i) in filteredLocations" :key="i">
        <span v-if="l"
          >{{ l.bookable?.title }} - {{ l.status }} - Preis:
          {{
            l.calculatedPrice || "n.a."
          }}</span
        >
      </li>
    </ul>
  </div>
</template>

<style></style>
