<template>
  <div
      class="grid sm:grid-cols-2 lg:flex gap-5"
      style="padding: 50px 0"
  >
    <div
        v-for="(category,i) in tempCategories"
        :key="i"
        class="rounded-b-xl w-full lg:flex-1"
    >
      <MainCategoryCard :category="category"/>
    </div>
  </div>
</template>
<script setup>
import MainCategoryCard from "~/components/MainCategoryCard.vue";

//toDo - read categories from instance settings
const tempCategories = [
  {
    value: "event-location",
    title: "Veranstaltungsorte",
    description: "Veranstaltungsorte in Ihrer Nähe",
    icon: "i-lucide-building-2",
    to: "/bookables",
  },
  {
    value: "room",
    title: "Räume",
    description: "Co-Working Spaces, Seminarräume u.v.m.",
    icon: "i-lucide-door-open",
    to: "/bookables",
  },
  {
    value: "resource",
    title: "Geräte & Weiteres",
    description: "Technik, Fahrzeuge & mehr mieten",
    icon: "i-lucide-wrench",
    to: "/bookables",
  },
  {
    value: "event",
    title: "Veranstaltungen",
    description: "Events & Kurse in Ihrer Nähe",
    icon: "i-lucide-calendar-check-2",
    to: "/events",
  },
];
</script>

<style scoped></style>
