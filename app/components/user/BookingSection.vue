<template>
  <div class="w-full">
    <div class="md:flex justify-between items-center w-full">
      <h2 class="text-2xl font-bold">Ihre Buchungen</h2>
      <UInput
        v-model="searchQuery"
        icon="i-lucide-search"
        size="md"
        variant="outline"
        placeholder="Suchen..."
        class="mt-2 md:mt-0 w-full md:w-auto"
        @keydown.enter="onSearch"
      />
    </div>

    <div class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-6">
      <BookingCard
        v-for="booking in searchedBookings"
        :key="booking.id"
        :booking="booking"
      />
    </div>
  </div>
</template>
<script setup>
import { useBookingStore } from "~~/stores/bookings.js";
import BookingCard from "~/components/user/BookingCard.vue";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import Fuse from "fuse.js";

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings();

const allBookings = computed(() => bookingsStore.getBookings);
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
  keys: ["bookableItems._bookableUsed.title"], //toDo - ergänzen!!!!!!!!!!!!!!!!!!!!!!
  includeScore: true,
  shouldSort: true,
  threshold: 0.3,
  findAllMatches: true,
  ignoreLocation: true
}
function onSearch(){
  console.log("Searching for:", searchQuery.value);
}
</script>

<style scoped></style>
