<template>
  <div class="w-full flex space-x-1">
    <UInput
      v-model="searchQuery"
      icon="i-lucide-search"
      size="md"
      variant="outline"
      placeholder="Suchen..."
      class="w-full"
    />
    <BookingsFilter @set-filter="setFilter" />
  </div>
</template>
<script setup>
import BookingsFilter from "~/components/user/bookings/BookingsFilter.vue";
import Fuse from "fuse.js";

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});
const emit = defineEmits(["update:bookings"]);

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
const fuseInstance = computed(() => new Fuse(props.bookings, searchOptions));

watch(searchQuery, (newQuery) => {
  if (!newQuery) {
    emit("update:bookings", props.bookings);
  } else {
    const results = fuseInstance.value.search(newQuery).map((r) => r.item);
    emit("update:bookings", results);
  }
});

//filter and sorting
const filters = ref([]);
watch(filters, (newFilter) => {
  if (!newFilter) {
    emit("update:bookings", props.bookings);
  } else {
    let filtered = props.bookings;

    filtered = filterForActiveBookings(filtered);

    filtered = filterForPaymentStatus(filtered);

    filtered = filterForStatus(filtered);

    filtered = sortBookings(filtered);

    emit("update:bookings", filtered);
  }
});

function setFilter(filter) {
  filters.value = filter;
}

function filterForActiveBookings(bookings) {
  if (!filters.value || !filters.value.activeBookings) {
    return bookings;
  }
  const currentTime = new Date().getTime();

  return bookings.filter(
    (b) => b.timeBegin < currentTime && b.timeEnd > currentTime,
  );
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
</script>

<style scoped></style>
