<script setup>
import { useBookableStore } from "~~/stores/bookable.js";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  name: "location-id",
});

const route = useRoute();
const bookableStore = useBookableStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const bookableID = computed(() => route.params.locationID);

const { loadBundle } = useCatalogBundle();

const bookable = computed(() => {
  return bookableStore.getBookableById(bookableID.value);
});

if (!bookable.value) {
  await loadBundle({ slug: catalogSlug.value, bookableID: bookableID.value });
}
</script>

<template>
  <article v-if="bookable">
    <h1>{{ bookable.name || bookable.title }}</h1>
    <p v-if="bookable.description">{{ bookable.description }}</p>
  </article>
  <p v-else>Ort nicht gefunden.</p>
</template>

<style scoped></style>
