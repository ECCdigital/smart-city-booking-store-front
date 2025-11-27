<template>
  <!-- Strip for md and larger screens -->
  <div class="hidden md:block">
    <div
      class="flex justify-between bg-white dark:bg-gray-700 -mt-5 p-2 z-100 rounded shadow-lg"
      style="position: relative; width: 60vw"
    >
      <InputText
        v-model="searchTerm"
        icon="i-lucide-search"
        placeholder="Wonach suchen Sie?"
        clearable
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputText
        v-model="searchLocation"
        icon="i-lucide-map-pin"
        placeholder="Ort"
        clearable
      />
      <USeparator orientation="vertical" :ui="{ border: 'border-gray-300' }" />
      <InputTimePeriod
        :time-period="searchTimePeriod"
        @select-date="setSearchTimePeriod"
        @remove-date="removeSearchTimePeriod"
      />
      <UButton
        label="Suchen"
        class="w-full justify-center"
        :style="{ color: contrastToPrimary }"
        @click="onSearch"
      />
    </div>
  </div>
  <!--Card for smaller screens -->
  <UCard
    class="bg-white dark:bg-gray-700 mx-5 -mt-15 p-0 shadow-lg md:hidden"
    :ui="{ root: 'p-0', body: 'p-0' }"
    style="position: relative; width: 80vw"
  >
    <InputText
      v-model="searchTerm"
      icon="i-lucide-search"
      placeholder="Wonach suchen Sie?"
      clearable
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputText
      v-model="searchLocation"
      icon="i-lucide-map-pin"
      placeholder="Ort"
      clearable
    />
    <USeparator class="w-full" :ui="{ border: 'border-gray-300' }" />
    <InputTimePeriod
      :time-period="searchTimePeriod"
      @select-date="setSearchTimePeriod"
      @remove-date="removeSearchTimePeriod"
    />
    <UButton
      label="Suchen"
      class="w-full justify-center"
      :style="{ color: contrastToPrimary }"
      @click="onSearch"
    />
  </UCard>
</template>
<script setup>
import InputText from "../inputs/InputText.vue";
import InputTimePeriod from "../inputs/InputTimePeriod.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import Fuse from "fuse.js";
import { useBookables } from "~/composables/api/useBookables.js";

const isInitialized = defineModel("isInitailized", { type: Boolean });
const filterResetKey = defineModel("filter-reset-key", { type: Number });

const props = defineProps({
  itemsToSearch: {
    type: Array,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["search", "initialize"]);
const searchTerm = ref("");
const searchLocation = ref("");
const searchTimePeriod = ref();

//SearchOptions
const bookableSearchTermOptions = {
  keys: ["item.title", "item.description", "item.flags", "item.tags"],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
};
const bookableSearchLocationOptions = {
  keys: ["item.description", "item.location"],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
};

const eventSearchTermOptions = {
  keys: [
    "item.information.name",
    "item.information.description",
    "item.information.teaserText",
    "item.information.flags",
    "item.information.tags",
    "item.eventOrganizer.name",
  ],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
};
const eventSearchLocationOptions = {
  keys: [
    "item.information.description",
    "item.eventLocation.name",
    "item.eventAddress.city",
    "item.eventAddress.zip",
    "item.eventAddress.street",
  ],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
};

const contrastToPrimary = computed(() =>
  useContrastColor().contrastToPrimary(),
);

function setSearchTimePeriod(timePeriod) {
  searchTimePeriod.value = timePeriod;
}
function removeSearchTimePeriod() {
  searchTimePeriod.value = null;
}
async function onSearch() {
  const hasCriteria = !!(
    searchTerm.value ||
    searchLocation.value ||
    (searchTimePeriod.value &&
      searchTimePeriod.value.startTime &&
      searchTimePeriod.value.endTime)
  );
  if (!hasCriteria) {
    emit("initialize");
    isInitialized.value = false;
    filterResetKey.value++;
    updateUrl();
    return;
  }
  isInitialized.value = true;

  let itemsWithStatus = setItemStatus();
  if (props.isEvent) {
    itemsWithStatus = await checkTickets(itemsWithStatus);
  }

  //include only items with status "isBookable"
  let bookableItems = itemsWithStatus.filter((i) => i.status === "isBookable");

  //search by search term and location
  bookableItems = searchForSearchTerm(bookableItems);
  bookableItems = searchForLocation(bookableItems);

  //search by time period
  const formatedTimePeriod = formateTimePeriod(searchTimePeriod.value);
  bookableItems = await searchForTimePeriod(bookableItems, formatedTimePeriod);

  const updatedBookableItems = await updateItemStatus(
    itemsWithStatus,
    bookableItems,
    formatedTimePeriod,
  );

  updateUrl();

  filterResetKey.value++;
  emit("search", {
    items: updatedBookableItems,
    searchParams: {
      searchTerm: searchTerm.value,
      searchLocation: searchLocation.value,
      searchTimePeriod: formatedTimePeriod,
    },
  });
}

function updateUrl() {
  const router = useRouter();
  const formattedTimePeriod = formateTimePeriod(searchTimePeriod.value);

  router.push({
    query: {
      searchTerm: encodeURIComponent(searchTerm.value) || "",
      searchLocation: encodeURIComponent(searchLocation.value) || "",
      startDate: formattedTimePeriod?.start || "",
      endDate: formattedTimePeriod?.end || "",
    },
  });
}
function readUrl() {
  const route = useRoute();
  searchTerm.value = decodeURIComponent(route.query.searchTerm || "");
  searchLocation.value = decodeURIComponent(route.query.searchLocation || "");
  const startDateRaw = route.query.startDate
    ? new Date(parseInt(route.query.startDate))
    : null;
  const startDate = startDateRaw ? startDateRaw.toISOString().slice(0, 10) : "";
  const startTime = startDateRaw ? startDateRaw.toTimeString().slice(0, 5) : "";

  const endDateRaw = route.query.endDate
    ? new Date(parseInt(route.query.endDate))
    : null;
  const endDate = endDateRaw ? endDateRaw.toISOString().slice(0, 10) : "";
  const endTime = endDateRaw ? endDateRaw.toTimeString().slice(0, 5) : "";

  searchTimePeriod.value = {
    startDate: startDate,
    startTime: startTime,
    endDate: endDate,
    endTime: endTime,
  };
}
onMounted(() => {
  readUrl();
  onSearch();
});

function setItemStatus() {
  return props.itemsToSearch.map((item) => {
    if (!props.isEvent && item.isBookable) {
      return { item: item, status: "isBookable" };
    } else if (props.isEvent) {
      return { item: item, status: "isBookable" };
    } else {
      return { item: item, status: "nonBookable" };
    }
  });
}
async function updateItemStatus(
  itemsWithStatus,
  bookableItems,
  formatedTimePeriod,
) {
  const updatedItems = await Promise.all(
    itemsWithStatus.map(async (item) => {
      if (item.status === "isBookable") {
        const isSuitable = bookableItems.includes(item);

        let price = null;
        if (formatedTimePeriod && !props.isEvent) {
          //get price for bookables
          price = await useBookables().getBookablePrice(
            item.item.tenantId,
            item.item.id,
            formatedTimePeriod.start,
            formatedTimePeriod.end,
          );
        } else if (formatedTimePeriod && props.isEvent) {
          //chec k price and availability for events
          //toDo - needed??
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
  return updatedItems;
}

function searchForSearchTerm(items) {
  if (searchTerm.value && !props.isEvent) {
    items = new Fuse(items, bookableSearchTermOptions)
      .search(searchTerm.value)
      .map((result) => result.item);
  } else if (searchTerm.value && props.isEvent) {
    items = new Fuse(items, eventSearchTermOptions)
      .search(searchTerm.value)
      .map((result) => result.item);
  }
  return items;
}
function searchForLocation(items) {
  if (searchLocation.value && !props.isEvent) {
    items = new Fuse(items, bookableSearchLocationOptions)
      .search(searchLocation.value)
      .map((result) => result.item);
  } else if (searchLocation.value && props.isEvent) {
    items = new Fuse(items, eventSearchLocationOptions)
      .search(searchLocation.value)
      .map((result) => result.item);
  }
  return items;
}

async function searchForTimePeriod(items, formatedTimePeriod) {
  if (formatedTimePeriod && formatedTimePeriod.start) {
    let availabilityChecks = [];
    if (!props.isEvent) {
      availabilityChecks = await Promise.all(
        items.map(async (item) => {
          const availability = await useBookables().getBookableAvailability(
            item.item.tenantId,
            item.item.id,
            formatedTimePeriod.start,
            formatedTimePeriod.end,
          );
          return {
            item,
            isAvailable: availability.isAvailable && availability.remaining > 0,
          };
        }),
      );
    } else if (props.isEvent) {
      availabilityChecks = items.map((item) => {
        const formatedEventTimePeriod = formateTimePeriod({
          startDate: item.item.information.startDate,
          startTime: item.item.information.startTime,
          endDate: item.item.information.endDate,
          endTime: item.item.information.endTime,
        });

        const isWithinPeriod =
          formatedEventTimePeriod &&
          formatedTimePeriod &&
          formatedEventTimePeriod.start >= formatedTimePeriod.start &&
          formatedEventTimePeriod.end <= formatedTimePeriod.end;

        return {
          item,
          isAvailable: isWithinPeriod,
        };
      });
    }
    items = availabilityChecks
      .filter((result) => result.isAvailable)
      .map((result) => result.item);
  }
  return items;
}

//build time period object (with timestamp) from selected time period
function formateTimePeriod(timePeriod) {
  if (timePeriod && timePeriod.startDate) {
    const newTimePeriod = {};

    newTimePeriod.start = new Date(
      timePeriod.startDate + " " + timePeriod.startTime,
    ).getTime();

    newTimePeriod.end = "";
    if (!timePeriod.endDate && timePeriod.endTime) {
      newTimePeriod.end = new Date(
        timePeriod.startDate + " " + timePeriod.endTime,
      ).getTime();
    } else {
      newTimePeriod.end = new Date(
        timePeriod.endDate + " " + timePeriod.endTime,
      ).getTime();
    }
    return newTimePeriod;
  }
  return null;
}
async function checkTickets(events) {
  const updatedEvents = await Promise.all(
    events.map(async (event) => {
      const updatedTickets = await Promise.all(
        event.item.tickets.map(async (ticket) => {
          const ticketPrice = await useBookables().getBookablePrice(
            event.item.tenantId,
            ticket.id,
          );
          const ticketAvailability =
            await useBookables().getBookableAvailability(
              event.item.tenantId,
              ticket.id,
            );
          return {
            ...ticket,
            calculatedPrice: ticketPrice,
            availability: ticketAvailability,
          };
        }),
      );
      return {
        ...event,
        item: {
          ...event.item,
          tickets: updatedTickets,
        },
      };
    }),
  );
  return updatedEvents;
}
</script>
<style scoped></style>
