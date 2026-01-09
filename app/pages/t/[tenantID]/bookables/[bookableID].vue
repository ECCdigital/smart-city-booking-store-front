<script setup>
import { useBookableStore } from "~~/stores/bookable.js";
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import DetailsArea from "~/components/search/DetailsArea.vue";

definePageMeta({
  layout: "bookable",
  middleware: ["catalog-auth"],
  name: "bookable-id",
});

const route = useRoute();
const bookableStore = useBookableStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const bookableID = computed(() => route.params.bookableID);

const { loadBundle } = useCatalogBundle();

const bookable = computed(() => {
  return bookableStore.getBookableById(bookableID.value);
});

if (!bookable.value) {
  await loadBundle({ slug: catalogSlug.value, bookableID: bookableID.value });
}
</script>

<template>
  <div v-if="bookable">
    <DetailsArea :item="bookable" />
  </div>
  <p v-else>Bookable nicht gefunden.</p>
</template>

<style scoped></style>
