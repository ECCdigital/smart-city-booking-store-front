<template>
  <div class="w-full md:w-[40%] flex">
    <UInput
      v-model="searchQuery"
      icon="i-lucide-search"
      size="md"
      variant="outline"
      :placeholder="$t('common.searchPlaceholder')"
      class="w-full"
      :ui="{ trailing: 'pe-0' }"
    >
      <template #trailing>
        <ClearButton
          :show-clear-button="!!searchQuery"
          @clear="searchQuery = ''"
        />
      </template>
    </UInput>
    <BookingsFilter :tenants="tenants" @set-filter="setFilter" />
  </div>
</template>
<script setup>
import ClearButton from "~/components/inputs/ClearButton.vue";
import BookingsFilter from "~/components/user/bookings/BookingsFilter.vue";
import Fuse from "fuse.js";
import {
  isPaidBooking,
  isUnpaidBooking,
} from "~/utils/bookingPaymentStatus.js";
import {
  BOOKING_STATUS,
  isCommittedBooking,
  isLiveBooking,
  resolveBookingStatus,
} from "~/utils/bookingStatus.js";
import {
  filterAccessBookingsByTenant,
  tenantsOfAccessBookings,
} from "~/utils/accessBookingList.js";

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

// The providers of the bookings, named like the booking details and the key
// list do: from the booking's tenant snapshot.
const { getBookingTenant } = useTenant();
const tenants = computed(() =>
  tenantsOfAccessBookings(
    props.bookings,
    (booking) => getBookingTenant(booking)?.name,
  ),
);

//filter and sorting
const filters = ref([]);

// Search and filters narrow together: the filters and the sorting apply to
// what the search finds, so changing one keeps the other.
watch([searchQuery, filters], ([query, filter]) => {
  let shown = query
    ? fuseInstance.value.search(query).map((r) => r.item)
    : props.bookings;

  shown = filterForBookingPeriod(shown);

  shown = filterForPaymentStatus(shown);

  shown = filterForStatus(shown);

  shown = filterAccessBookingsByTenant(shown, filter?.tenantIds);

  shown = sortBookings(shown);

  emit("update:bookings", shown);
});

function setFilter(filter) {
  filters.value = filter;
}

function filterForBookingPeriod(bookings) {
  if (!filters.value || !filters.value.periodFilter) {
    return bookings;
  }

  const currentTime = new Date().getTime();
  const oneHourInMs = 60 * 60 * 1000;

  const getBeginTime = (booking) => {
    if (booking.timeBegin) {
      return booking.timeBegin;
    } else if (booking.eventBegin) {
      return booking.eventBegin;
    } else {
      return null;
    }
  };
  const getEndTime = (booking) => {
    if (booking.timeEnd) {
      return booking.timeEnd;
    } else if (booking.eventEnd) {
      return booking.eventEnd;
    } else {
      return null;
    }
  };

  if (filters.value.periodFilter === "all") {
    return bookings;
  } else if (filters.value.periodFilter === "upcoming") {
    return bookings.filter((b) => {
      const beginTime = getBeginTime(b);

      return beginTime != null && beginTime > currentTime;
    });
  } else if (filters.value.periodFilter === "past") {
    return bookings.filter((b) => {
      const endTime = getEndTime(b);
      return endTime != null && endTime < currentTime;
    });
  } else if (filters.value.periodFilter === "active") {
    return bookings.filter((b) => {
      const beginTime = getBeginTime(b);
      const endTime = getEndTime(b);
      return (
        beginTime != null &&
        endTime != null &&
        beginTime < currentTime + oneHourInMs &&
        endTime > currentTime - oneHourInMs
      );
    });
  }

  return bookings;
}

function filterForPaymentStatus(bookings) {
  if (
    !filters.value ||
    (!filters.value.paymentsConfirmed && !filters.value.paymentsUnconfirmed)
  ) {
    return bookings;
  }
  return bookings.filter((b) => {
    if (filters.value.paymentsConfirmed && isPaidBooking(b)) {
      return true;
    }
    if (filters.value.paymentsUnconfirmed && isUnpaidBooking(b)) {
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
    // One checkbox covers rejected and cancelled: neither booking lives on.
    if (filters.value.statusRejected && !isLiveBooking(b)) {
      return true;
    }
    if (filters.value.statusConfirmed && isCommittedBooking(b)) {
      return true;
    }
    if (
      filters.value.statusPending &&
      resolveBookingStatus(b) === BOOKING_STATUS.REQUESTED
    ) {
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
    case "bookingDate-desc":
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
