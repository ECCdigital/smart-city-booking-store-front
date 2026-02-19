<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full">
      <h1 class="text-2xl font-bold">Ihre Buchungen</h1>
      <div class="w-full md:w-[40%] flex">
        <UInput
          v-model="searchQuery"
          icon="i-lucide-search"
          size="md"
          variant="outline"
          placeholder="Suchen..."
          class="mt-2 md:mt-0 w-full"
        />
        <BookingsFilter @set-filter="setFilter" />
      </div>
    </div>

    <div class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6">
      <BookingCard
        v-for="booking in paginatedBookings"
        :key="booking.id"
        :booking="booking"
      />
    </div>

    <div class="flex justify-center mt-2 mb-10">
      <UPagination
        v-model:page="currentPage"
        :items-per-page="itemsPerPage"
        :total="filteredBookings.length"
        :sibling-count="1"
        show-edges
      >
        <template #first>
          <span class="hidden" />
        </template>

        <template #last>
          <span class="hidden" />
        </template>
      </UPagination>
    </div>
  </div>
</template>
<script setup>
import BookingCard from "~/components/user/BookingCard.vue";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import Fuse from "fuse.js";
import BookingsFilter from "~/components/user/bookings/BookingsFilter.vue";
import {useBreakpointCheck} from "~/composables/utils/useBreakpointCheck.js";

const props = defineProps({
  bookings: {
    type: Array,
    required: false,
    default: null,
  },
});

const allBookings = computed(() =>
  props.bookings
    .sort((a, b) => b.timeCreated - a.timeCreated)
    .map((b) => ({
      ...b,
      displayBookingDate: new Date(b.timeCreated).toLocaleDateString("de-DE", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      statusLabel: b.isRejected
        ? "Storniert"
        : b.isCommitted
          ? "Bestätigt"
          : "Ausstehend",
      payedLabel: b.isPayed ? "bezahlt" : "nicht bezahlt",
    })),
);
const searchedBookings = computed(() => {
  if (!searchQuery.value) {
    return allBookings.value;
  }

  const fuse = new Fuse(allBookings.value, searchOptions);
  const results = fuse.search(searchQuery.value);
  return results.map((result) => result.item);
});

const filteredBookings = computed(() => {
  if (!filters.value) {
    return searchedBookings.value;
  }

  let bookings = searchedBookings.value;
  bookings = filterForPaymentStatus(bookings);

  bookings = filterForStatus(bookings);

  bookings = sortBookings(bookings);

  return bookings;
});

const paginatedBookings = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  const end = start + itemsPerPage.value;
  return filteredBookings.value.slice(start, end);
});

const { loadBundle } = useCatalogBundle();
if (
  allBookings.value.some((booking) => {
    return booking.bookableItems.some(
      (item) => item._bookableUsed.type === "ticket",
    );
  })
) {
  await loadBundle({ include: ["events"] });
}

//pagination
const { isGreaterThanLg } = useBreakpointCheck();
const currentPage = ref(1);
const itemsPerPage = computed(() => {
  if (isGreaterThanLg) {
    return 12
  }
  return 10
})

//search
const searchQuery = ref("");
const searchOptions = {
  keys: [
    "id",
    "bookableItems._bookableUsed.title",
    "displayBookingDate",
    "statusLabel",
    "payedLabel",
  ],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
  findAllMatches: true,
  ignoreLocation: true,
};

//filter and sorting
const filters = ref(null);

function setFilter(filter) {
  filters.value = filter;
}

function filterForPaymentStatus(bookings) {
  if (
    !filters.value ||
    (!filters.value.paymentsConfirmed && !filters.value.paymentsUnconfirmed)
  ) {
    return bookings;
  }
  return bookings.filter((b) => {
    if (filters.value.paymentsConfirmed && b.isPayed) {
      return true;
    }
    if (filters.value.paymentsUnconfirmed && !b.isPayed) {
      return true;
    }
    return false;
  });
}

function filterForStatus(bookings) {
  if (
    !filters.value ||
    (!filters.value.statusConfirmed &&
      !filters.value.statusRejected &&
      !filters.value.statusPending)
  ) {
    return bookings;
  }

  return bookings.filter((b) => {
    if (filters.value.statusRejected && b.isRejected) {
      return true;
    }
    if (filters.value.statusConfirmed && b.isCommitted && !b.isRejected) {
      return true;
    }
    if (filters.value.statusPending && !b.isCommitted && !b.isRejected) {
      return true;
    }
    return false;
  });
}

function sortBookings(bookings) {
  if (!filters.value || !filters.value.sortOption) {
    return bookings;
  }

  const sortedBookings = [...bookings];
  switch (filters.value.sortOption) {
    case "bookingDate-asc":
      sortedBookings.sort((a, b) => a.timeCreated - b.timeCreated);
      break;
    case "bookingsDate-desc":
      sortedBookings.sort((a, b) => b.timeCreated - a.timeCreated);
      break;
    case "price-asc":
      sortedBookings.sort((a, b) => a.priceEur - b.priceEur);
      break;
    case "price-desc":
      sortedBookings.sort((a, b) => b.priceEur - a.priceEur);
      break;
    case "date-asc":
      sortedBookings.sort((a, b) => {
        const aTime =
          a.timeBegin != null
            ? a.timeBegin
            : a.eventTime && a.eventTime[0] != null
              ? a.eventTime[0]
              : null;
        const bTime =
          b.timeBegin != null
            ? b.timeBegin
            : b.eventTime && b.eventTime[0] != null
              ? b.eventTime[0]
              : null;
        if (aTime == null && bTime == null) return 0;
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return aTime - bTime;
      });
      break;
    case "date-desc":
      sortedBookings.sort((a, b) => {
        const aTime =
          a.timeBegin != null
            ? a.timeBegin
            : a.eventTime && a.eventTime[0] != null
              ? a.eventTime[0]
              : null;
        const bTime =
          b.timeBegin != null
            ? b.timeBegin
            : b.eventTime && b.eventTime[0] != null
              ? b.eventTime[0]
              : null;
        if (aTime == null && bTime == null) return 0;
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return bTime - aTime;
      });
      break;
    case "title-asc":
      sortedBookings.sort((a, b) =>
        a.bookableItems[0]._bookableUsed.title.localeCompare(
          b.bookableItems[0]._bookableUsed.title,
        ),
      );
      break;
    case "title-desc":
      sortedBookings.sort((a, b) =>
        b.bookableItems[0]._bookableUsed.title.localeCompare(
          a.bookableItems[0]._bookableUsed.title,
        ),
      );
      break;

    default:
      break;
  }
  return sortedBookings;
}

//events
/*async function getEventTime(eventId) {
  //toDo - build function to read event time from booking (upcoming)
  console.log("want to get event time for eventId ", eventId);
  return null;
}*/
</script>

<style scoped></style>
