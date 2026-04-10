<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import BookableSection from "~/components/bookables/BookableSection.vue";

definePageMeta({
  layout: "catalog",
  hero: {
    height: "sm",
    showOnMobile: true,
  },
});

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
await loadBundle({ include: ["bookables"] });

const allBookables = computed(() => {
  return bookableStore.getBookables;
});
</script>

<template>
  <BookableSection :bookables="allBookables" />
</template>
