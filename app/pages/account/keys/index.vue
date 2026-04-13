<template>
  <div class="w-full">
    <PageHeader
      title="Ihre Schlüssel"
      class="mb-3 md:mb-0"
    />
    <KeySection :bookings="filteredBookings" />
  </div>
</template>
<script setup>
import KeySection from "~/components/mobileKey/KeySection.vue";
import { useBookingStore } from "~~/stores/bookings.js";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const bookingsStore = useBookingStore();

const { pending } = useAsyncData("bookings", async () => {
  return await bookingsStore.fetchBookings();
});

const bookings = computed(() => bookingsStore.getBookings);

const sortedBookings = computed(() =>
    [...bookings.value].sort((a, b) => b.timeCreated - a.timeCreated)
);

const filteredBookings = ref(null);

watch(
    sortedBookings,
    (val) => {
      filteredBookings.value = val;
    },
    { immediate: true }
);

</script>

<style scoped></style>