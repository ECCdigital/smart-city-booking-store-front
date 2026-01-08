<template>
  <div
      class="grid md:grid-cols-2 lg:flex justify-self-center space-x-3"
      style="max-width: 90vw; margin: auto; padding: 50px 0"
  >
    <div
        v-for="(category,i) in tempCategories"
        :key="i"
        class="rounded-b-xl p-5"
        style="width: 400px"
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
    value: "location",
    title: "Veranstaltungsorte",
    description: "Veranstaltungatsorte in Ihrer Nähe",
    icon: "i-lucide-building-2",
    to: '/locations'
  },
  {
    value: "room",
    title: "Räume",
    description: "Co-Working Spaces, Seminarräume u.v.m.",
    icon: "i-lucide-door-open",
    to: '/locations'
  },
  {
    value: "resource",
    title: "Geräte & Fahrzeuge",
    description: "Technik, Fahrzeuge & mehr mieten",
    icon: "i-lucide-wrench",
    to: '/bookables'
  },
  {
    value: "event",
    title: "Veranstaltungen",
    description: "Events & Kurse in Ihrer Nähe",
    icon: "i-lucide-calendar-check-2",
    to: '/events'
  }
]
</script>


<style scoped>

</style>