<template>
  <div>
    <BookingSection v-if="bookings" :bookings="bookings"/>
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

const bookings = computed(() => {
  return bookingsStore.getBookings
})
</script>

<style scoped>

</style>