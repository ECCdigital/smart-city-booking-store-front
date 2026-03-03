<template>
<div>
  <BackButton class="mt-2" />
  <PageHeader title="Buchungsdetails" class="my-5"/>
 <BookingDetailsSection v-if="booking" :booking="booking" />
</div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";
import BackButton from "~/components/BackButton.vue";

definePageMeta({
  name: "bookings-booking-id",
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