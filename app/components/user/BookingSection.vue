<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full">
      <h2 class="text-2xl font-bold">Ihre Buchungen</h2>
      <UInput
        v-if="!choosenBooking"
        v-model="searchQuery"
        icon="i-lucide-search"
        size="md"
        variant="outline"
        placeholder="Suchen..."
        class="mt-2 md:mt-0 w-full md:w-auto"
      />
    </div>

    <BookingDetailsSection v-if="choosenBooking" :booking="choosenBooking" @go-back="() => choosenBooking = null"/>

    <div
      v-else
      class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6"
    >
      <BookingCard
        v-for="booking in searchedBookings"
        :key="booking.id"
        :booking="booking"
        @open-details="() => (choosenBooking = booking)"
      />
    </div>
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingCard from "~/components/user/BookingCard.vue";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import Fuse from "fuse.js";
import BookingDetailsSection from "~/components/user/BookingDetailsSection.vue";

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const allBookings = computed(() => {
  return bookingsStore.getBookings.map((b) => ({
    ...b,
    displayBookingDate: new Date(b.timeCreated).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    statusLabel: b.isRejected
      ? "Storniert"
      : b.isCommitted
        ? "Bestätigt"
        : "Ausstehend",
    payedLabel: b.isPayed ? "bezahlt" : "nicht bezahlt",
  }));
});
const searchedBookings = computed(() => {
  if (!searchQuery.value) {
    return allBookings.value;
  }

  const fuse = new Fuse(allBookings.value, searchOptions);
  const results = fuse.search(searchQuery.value);
  return results.map((result) => result.item);
});

const { loadBundle } = useCatalogBundle();
if (
  allBookings.value.some((booking) => {
    return booking.bookableItems.some(
      (item) => item._bookableUsed.type === "ticket",
    );
  })
) {
  await loadBundle({ include: ["events"] });
}

const searchQuery = ref("");
const searchOptions = {
  keys: [
    "id",
    "bookableItems._bookableUsed.title",
    "displayBookingDate",
    "statusLabel",
    "payedLabel",
  ],
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
  findAllMatches: true,
  ignoreLocation: true,
};

const choosenBooking = ref(null);
</script>

<style scoped></style>
