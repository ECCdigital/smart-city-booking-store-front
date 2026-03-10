<template>
  <div>
    <PageHeader title="Ihre Buchungen" />
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
</script>

<style scoped>

</style>