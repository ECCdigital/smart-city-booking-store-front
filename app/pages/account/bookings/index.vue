<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
      <PageHeader title="Ihre Buchungen" class="mb-3 md:mb-0" />
      <div
        class="w-full md:w-[60%] xl:w-[50%] md:flex md:space-x-1 space-y-2 md:space-y-0"
      >
        <BookingsExportButton v-if="bookings.length > 0" :bookings="bookings" />
        <BookingSearchFilterArea
          :bookings="bookings"
          @update:bookings="setFilteredBookings"
        />
      </div>
    </div>

    <div v-if="activeBookingsWithLocking?.length">
      <h2 class="text-xl font-bold">
        Aktuelle Buchungen mit Schließberechtigung
      </h2>
      <BookingSection
        :bookings="activeBookingsWithLocking"
        :use-pagination="activeBookingsWithLocking.length > 10"
      />

      <h2 class="mt-5 text-xl font-bold">Alle Buchungen</h2>
    </div>

    <BookingsSkeleton v-if="pending" :skeleton-count="9" />
    <BookingSection
      v-else-if="filteredBookings?.length"
      :bookings="filteredBookings"
    />
    <BookingEmptyState v-else />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";
import { useBookingStore } from "~~/stores/bookings.js";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import BookingEmptyState from "~/components/user/bookings/BookingEmptyState.vue";
import BookingSearchFilterArea from "~/components/user/bookings/BookingSearchFilterArea.vue";
import BookingsExportButton from "~/components/user/bookings/BookingsExportButton.vue";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const bookingsStore = useBookingStore();

const { pending } = useAsyncData("bookings", async () => {
  return await bookingsStore.fetchBookings();
});

const bookings = computed(() => bookingsStore.getBookings);

const sortedBookings = computed(() =>
  [...bookings.value].sort((a, b) => b.timeCreated - a.timeCreated),
);

const filteredBookings = ref(null);

watch(
  sortedBookings,
  (val) => {
    filteredBookings.value = val;
  },
  { immediate: true },
);

function setFilteredBookings(newBookings) {
  filteredBookings.value = newBookings.map((b) => ({ ...b }));
}

const activeBookingsWithLocking = computed(() => {
  const withLockerInfo = filteredBookings.value.filter(
    (booking) =>
      booking.lockerInfo.length > 0 &&
      booking.lockerInfo.some((info) => info.lockerSystem === "ifbs"),
  );

  const currentTime = new Date().getTime();
  const twoHoursMs = 2 * 60 * 60 * 1000;

  return withLockerInfo.filter(
    (b) =>
      b.timeBegin - twoHoursMs < currentTime &&
      b.timeEnd + twoHoursMs > currentTime &&
      b.isRejected === false,
  );
});
</script>

<style scoped></style>
