<template>
  <div class="w-full">
    <PageHeader
      title="Ihre Schlüssel"
      description="Hier finden Sie Ihre aktiven Buchungen mit Schließsystem-Zugriff."
      class="mb-3 md:mb-0"
    />

    <KeySection :bookings="filteredBookings" />
  </div>
</template>
<script setup>
import KeySection from "~/components/mobileKey/KeySection.vue";
import { useBookingStore } from "~~/stores/bookings.js";

definePageMeta({
  name: "tenant-keys",
  layout: "user",
  middleware: ["user-auth"],
});

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const bookings = computed(() => bookingsStore.getBookings);
const filteredBookings = ref(
  bookings.value.sort((a, b) => b.timeCreated - a.timeCreated),
);
</script>

<style scoped></style>
