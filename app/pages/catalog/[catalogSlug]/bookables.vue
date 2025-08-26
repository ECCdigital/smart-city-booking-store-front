<template>
  <div>
    Bookables Seite
    {{ bookables }}
  </div>
</template>

<script setup>
import { useBookableStore } from "~~/stores/bookable.js";

definePageMeta({
  name: "bookables",
});

const bookableStore = useBookableStore();

const { bookables } = storeToRefs(bookableStore);
</script>

<style scoped></style>
