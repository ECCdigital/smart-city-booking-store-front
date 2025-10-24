<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useBookableStore } from "~~/stores/bookable";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../../../components/search/BookableResultsList.vue";
import { useBookables } from "../../../../composables/api/useBookables.js";
import { useBreakpointCheck } from "../../../../composables/utils/useBreakpointCheck.js";
import BookableResultsGrid from "../../../../components/search/BookableResultsGrid.vue";
import FilterArea from "../../../../components/search/FilterArea.vue";
import SortButton from "../../../../components/search/SortButton.vue";
import FilterButton from "../../../../components/search/FilterButton.vue";

definePageMeta({ name: "catalog-locations" });

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
const filteredLocations = ref(allLocations.value); //ref([]); //toDo --**********************************
const { bookables } = storeToRefs(bookableStore);

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
      return { bookable: location, status: "notBookable" };
    }
  });
  //toDo - wenn "notBookable" auch noch related bookables prüfen!?
  console.log(locationsWithStatus);

  //toDo - vorfiltern und prüfen, was überhaupt buchbar ist
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

        //toDo - wenn "remaining" gefixt, dann ebenfalls berücksichtigen
        return { location, isAvailable: availability.isAvailable };
      }),
    );

    console.log("avivi: ", availabilityChecks)
    bookableLocations = availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.location);
  }

  //Status updaten
  const temp = await Promise.all(locationsWithStatus.map(async (item) => {
    if (item.status === "isBookable") {
      const isSuitable = bookableLocations.includes(item);

      let price = null;
      if (timePeriod ) {
        //toDo - Preis raussuchen und mit ins Objekt schreiben
        price = await useBookables().getBookablePrice(
            item.bookable.tenantId,
            item.bookable.id,
            formatedTimePeriod.start.getTime(),
            formatedTimePeriod.end.getTime(),
        )
      }

      return {
        ...item,
        status: isSuitable ? "suitable" : "nonSuitable",
        calculatedPrice: isSuitable ? price : null, //toDo - Hardcore Preis ersetzen
      };
    } else {
      return {
        ...item,
        status: "nonBookable",
        calculatedPrice: null,
      };
    }
  }));
  console.log(temp);
  filteredLocations.value = temp; //toDo - temp umbenennen!!
}
function  numberOfSuitableBookables() {
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
  console.log("Art der Sortierung: ", mode);
  //toDo - momentan "relevanz" nach Fuze-Suche...
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

    <div class="m-10 lg:m-5 flex items-center">
      <span class="lg:text-black lg:font-bold"
        >{{ numberOfSuitableBookables() }} passende Ergebnisse</span
      >
      <div class="" style="flex: 1" />
      <SortButton v-if="filteredLocations.length > 0" @sort="sortBookables" />
      <FilterButton
        v-if="filteredLocations.length > 0"
        class="lg:hidden"
        @filter="testFunction"
      />
    </div>

    <div class="flex flex-row lg:my-5 m-5">
      <!-- Filterbereich -->
      <div v-if="isGreaterThanMd" class="md:basis-1/4">
        <FilterArea
          v-if="filteredLocations.length > 0"
          @filter="testFunction"
        />
      </div>

      <div class="md:basis-3/4">
        <BookableResultsList
          v-if="isGreaterThanMd"
          :bookables="filteredLocations"
          include-non-bookable
          include-non-suitable
        />
        <BookableResultsGrid
          v-else
          :bookables="filteredLocations"
          include-non-bookable
          include-non-suitable
        />
      </div>
    </div>
  </div>
</template>

<style></style>
