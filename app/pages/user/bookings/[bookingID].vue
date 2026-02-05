<template>
<div>
 <BookingDetailsSection v-if="booking" :booking="booking" />
</div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";

definePageMeta({
  name: "bookings-booking-id",
  layout: "user",
  middleware: ["user-auth"],

});

const route = useRoute()
const bookingStore = useBookingStore()

const routeParams = computed(() => route.params)
const bookingID = computed(() => routeParams.value.bookingID)

const booking = computed(() => {
  return bookingStore.getBookingById(bookingID.value)
})
</script>
<style scoped></style>