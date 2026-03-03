<template>
  <div class="w-full">
    <PageHeader title="Ihre Buchungen" />
    <BookingsSkeleton v-if="pending" :skeleton-count="9" />
    <BookingSection v-else-if="bookings?.length" :bookings="bookings" />
    <BookingEmptyState v-else />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";
import { useBookingStore } from "~~/stores/bookings.js";
import BookingsSkeleton from "~/components/user/bookings/BookingsSkeleton.vue";
import BookingEmptyState from "~/components/user/bookings/BookingEmptyState.vue";

definePageMeta({
  name: "bookings",
  layout: "user",
});

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const { pending } = useAsyncData("bookings", () =>
  bookingsStore.fetchBookings()
);

const bookings = computed(() => bookingsStore.getBookings);
</script>

<style scoped></style>
