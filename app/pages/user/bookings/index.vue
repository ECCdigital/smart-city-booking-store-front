<template>
  <div>
    <USkeleton v-if="pending" class="h-64 w-full" />
    <BookingSection v-else-if="bookings?.length" :bookings="bookings" />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";
import {useBookingStore} from "~~/stores/bookings.js";

definePageMeta({
  name: "bookings",
  layout: "user",
  middleware: ["user-auth"],
});

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const { pending } = useAsyncData("bookings", () =>
    bookingsStore.fetchBookings()
);

const bookings = computed(() => bookingsStore.getBookings);
</script>

<style scoped>

</style>