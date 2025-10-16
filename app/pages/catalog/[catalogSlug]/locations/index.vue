<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useBookableStore } from "~~/stores/bookable";
import Fuse from "fuse.js";
import "@vuepic/vue-datepicker/dist/main.css";
import BookableSearchBar from "../../../../components/search/BookableSearchBar.vue";
import BookableResultsList from "../../../../components/search/BookableResultsList.vue";

definePageMeta({ name: "catalog-locations" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allLocations = computed(() => {
  let locations = bookableStore.getLocations;
  return locations.concat(bookableStore.getRooms);
});
const filteredLocations = ref(allLocations.value);
const { bookables } = storeToRefs(bookableStore);

//Search
const searchTermOptions = {
  keys: ["title", "description", "flags", "tags"],
  //toDo - was noch???
  includeScore: true,
  shouldSort: true,
};
const searchLocationOptions = {
  keys: ["description", "location"], //toDo - was noch???
  includeScore: true,
  shouldSort: true,
};

function onSearch({ term, location, timePeriod }) {
  let locations = allLocations.value;
  //nach Suchbegriff suchen
  if (term) {
    locations = new Fuse(locations, searchTermOptions)
      .search(term)
      .map((result) => result.item);
  }
  //nach Ort suchen
  if (location) {
    locations = new Fuse(locations, searchLocationOptions)
      .search(location)
      .map((result) => result.item);
  }

  //nach Zeit suchen
  if (timePeriod) {
    console.log("want so search for time ->", timePeriod);
    //toDo - später auslagern...
    locations = locations.filter((location) => {
      //toDo - check specialOpeningHours

      if (!location.isOpeningHoursRelated) {
        return true;
      } else {
        //check hours
        console.log("found openingHours for ", location.title);
        let isOpenedDay = false;
        let isOpenedTime = false;

        if (timePeriod.startDate && !timePeriod.endDate) {
          //wenn nur startDatum, Wochentag ermitteln und abgleichen
          const weekday = timePeriod.startDate.getDay();
          console.log("only got startDate an Day...", weekday);
          isOpenedDay = location.openingHours.some((timeSlot) =>
            timeSlot.weekdays.includes(weekday),
          );

          if (isOpenedDay && timePeriod.startTime) {
            //wenn am startDatum geöffnet,alle Zeitslots suchen, die den Wochentag beinhalten (können mehrere sein)
            const suitableDays = location.openingHours.filter((t) =>
              t.weekdays.includes(weekday),
            );

            //Uhrzeiten der entsprechenden Tage abgleichen
            isOpenedTime = suitableDays.some((openingTime) =>
              isTimeInInterval(
                timePeriod.startTime,
                timePeriod.endTime,
                openingTime.startTime,
                openingTime.endTime,
              ),
            );
            return isOpenedTime;
          }

          return isOpenedDay;
        } else {
          //wenn auch endDatum
          console.log("also got endDate...");
        }
      }
    });
  }
  filteredLocations.value = locations;
}

function timeStringToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":").map(Number);
  return hours * 60 + minutes;
}

function isTimeInInterval(
  startTime,
  endTime,
  startOpeningHours,
  endOpeningHours,
) {
  const startOpeningHoursInMinutes = timeStringToMinutes(startOpeningHours);
  const endOpeningHoursInMinutes = timeStringToMinutes(endOpeningHours);

  const startTimeInMinutes = timeStringToMinutes(startTime);
  let isDuringOpeningHours =
    startTimeInMinutes >= startOpeningHoursInMinutes &&
    startTimeInMinutes <= endOpeningHoursInMinutes;

  if (isDuringOpeningHours && endTime) {
    const endTimeInMinutes = timeStringToMinutes(endTime);
    isDuringOpeningHours =
      endTimeInMinutes >= startOpeningHoursInMinutes &&
      endTimeInMinutes <= endOpeningHoursInMinutes;
  }
  return isDuringOpeningHours;
}
function testFunction() {
  console.log("coming soon...");
}
</script>

<template>
  <div>
    <BookableSearchBar @search="onSearch" />

    <BookableResultsList
      :bookables="filteredLocations"
      @filter="testFunction"
      @sort="testFunction"
    />
  </div>
</template>

<style></style>
