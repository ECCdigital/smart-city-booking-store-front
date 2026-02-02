<template>
  <div class="md:container bg-neutral-50 dark:bg-gray-950 md:flex h-[60vh] pt-7">
    <div class="md:basis-1/6 border border-gray-200 rounded p-2 space-y-1 hidden md:block">
      <div
        v-for="(item, i) in userNavigation"
        :key="i"
        class="bg-gray-100 dark:bg-gray-900 flex rounded p-2 cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-800"
        :class="activeItem === item.value ? 'font-bold bg-primary/40' : ''"
        @click="setActiveItem(item.value)"
      >
        <UIcon :name="item.icon" class="mr-3 mt-1" />
        {{ item.label }}
      </div>
    </div>
    <UTabs v-model="activeItem" color="primary" variant="pill" :content="false" :items="userNavigation" class="mx-2 mb-5 block md:hidden" />


    <div class="px-5 md:basis-5/6">
      <div v-if="activeItem === 'bookings'">
        <h2 class="text-2xl font-bold">Ihre Buchungen</h2>
        {{ user }}
        <hr>
        {{allBookings}}
      </div>
      <div v-if="activeItem === 'invoices'">
        <h2 class="text-2xl font-bold">Ihre Rechnungen</h2>
        {{ user }}
      </div>

    </div>
  </div>
</template>
<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useBookingStore } from "~~/stores/bookings.js";

definePageMeta({
  layout: "catalog",
});

const bookingsStore = useBookingStore();
await bookingsStore.fetchBookings()

const allBookings = computed(() => bookingsStore.getBookings);


const user = computed(() => useAuthStore().getUser);

const userNavigation = [
  {
    value: "bookings",
    label: "Buchungen",
    icon: "i-lucide-book-marked"
  },
  {
    value: "invoices",
    label: "Rechnungen",
    icon: "i-lucide-wallet-cards"
  },
  {
    value: "favorites",
    label: "Favoriten",
    icon: "i-lucide-book-heart"
  },
];
const activeItem = ref("bookings");
function setActiveItem (item) {
  console.log("Setting active item to:", item);
  activeItem.value = item;
};
</script>

<style scoped></style>
