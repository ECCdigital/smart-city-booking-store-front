<template>
  <div>
    <BackButton class="mt-5 md:mt-0" />
    <PageHeader title="Schlüsseldetails" class="my-5" />
    <KeyDetailsSection :booking="booking" />
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import KeyDetailsSection from "~/components/mobileKey/KeyDetailsSection.vue";
import BackButton from "~/components/BackButton.vue";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
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

<style scoped></style>
