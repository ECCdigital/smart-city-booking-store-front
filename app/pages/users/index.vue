<template>
  <div class="md:container bg-neutral-50 dark:bg-gray-950 md:flex h-[60vh] pt-7">
    <div class="border border-gray-200 rounded p-2 space-y-1 hidden md:block" style="width: 350px; max-width: 30vw">
      <div
        v-for="(item, i) in userNavigation"
        :key="i"
        class="bg-gray-100 dark:bg-gray-900 border-b-gray-200 rounded p-2 cursor-pointer hover:bg-gray-200 hover:dark:bg-gray-800"
        :class="activeItem === item.value ? 'font-bold bg-primary/40' : ''"
        @click="setActiveItem(item.value)"
      >
        {{ item.label }}
      </div>
    </div>
    <UTabs v-model="activeItem" color="primary" variant="pill" :content="false" :items="userNavigation" class="mx-2 mb-5 block md:hidden" />


    <div class="px-5">
      <div v-if="activeItem === 'bookings'" id="bookingsContent">
        <h2 class="text-2xl font-bold">Ihre Buchungen</h2>
        {{ user }}
      </div>

    </div>
  </div>
</template>
<script setup>
import { useAuthStore } from "~~/stores/auth.js";

definePageMeta({
  layout: "catalog",
});
const user = computed(() => useAuthStore().getUser);

const userNavigation = [
  {
    value: "bookings",
    label: "Buchungen",
  },
  {
    value: "invoices",
    label: "Rechnungen",
  },
  {
    value: "favorites",
    label: "Favoriten",
  },
];
const activeItem = ref("bookings");
function setActiveItem (item) {
  console.log("Setting active item to:", item);
  activeItem.value = item;
};
</script>

<style scoped></style>
