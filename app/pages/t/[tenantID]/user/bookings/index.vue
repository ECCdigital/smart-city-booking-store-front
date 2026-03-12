<template>

  <div class="w-full">
    <div class="md:flex justify-between items-center w-full mb-4">
    <PageHeader title="Ihre Buchungen" />
    <BookingSearchFilterArea
        :bookings="bookings"
        @update:bookings="setFilteredBookings"
    />
    </div>
    <BookingsSkeleton v-if="pending" :skeleton-count="9" />
    <BookingSection v-else-if="bookings" :bookings="bookings"/>
    <BookingEmptyState v-else />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";
import {useBookingStore} from "~~/stores/bookings.js";
import BookingEmptyState from "~/components/user/bookings/BookingEmptyState.vue";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import BookingSearchFilterArea from "~/components/user/bookings/BookingSearchFilterArea.vue";

definePageMeta({
  name: "tenant-bookings",
  layout: "user",
  middleware: ["user-auth"],
});

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const { pending } = useAsyncData("bookings", () =>
    bookingsStore.fetchBookings()
);

const bookings = computed(() => {
  return bookingsStore.getBookings
})
const filteredBookings = ref(bookings.value.sort((a, b) => b.timeCreated - a.timeCreated));

function setFilteredBookings(bookings) {
  filteredBookings.value = bookings.map(b => ({ ...b }));
}
</script>

<style scoped>

</style>