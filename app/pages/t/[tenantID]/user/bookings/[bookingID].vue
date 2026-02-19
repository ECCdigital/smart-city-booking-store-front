<template>
  <div>
    <BookingDetailsSection v-if="booking" :booking="booking" />
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";

definePageMeta({
  name: "tenant-bookings-booking-id",
  layout: "user",
  middleware: ["user-auth"],

});

const bookingStore = useBookingStore()
await bookingStore.fetchBookings();

const route = useRoute()
const routeParams = computed(() => route.params)
const bookingID = computed(() => routeParams.value.bookingID)

const booking = computed(() => {
  if(!bookingID.value) {
    return null
  }
  return bookingStore.getBookingById(bookingID.value)
})
</script>
<style scoped></style>