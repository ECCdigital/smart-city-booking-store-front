<template>
  <div>
    {{ booking }}
  </div>
</template>
<script setup>
import {useBookingStore} from "~~/stores/bookings.js";

definePageMeta({
  name: "tenant-keys-process-id",
  layout: "user",
  middleware: ["user-auth"],
});


const bookingStore = useBookingStore();
await bookingStore.fetchBookings();

const route = useRoute();
const routeParams = computed(() => route.params);
const bookingID = computed(() => routeParams.value.bookingID);

const booking = computed(() => {
  if (!bookingID.value) {
    return null;
  }
  return bookingStore.getBookingById(bookingID.value);
});
</script>


<style scoped>

</style>