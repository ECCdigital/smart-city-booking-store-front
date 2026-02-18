<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import BookableSection from "~/components/bookables/BookableSection.vue";

definePageMeta({
  name: "tenant-catalog-bookables",
  layout: "catalog",
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
const tenantID = computed(() => route.params.tenantID);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
await loadBundle({
  tenantID: tenantID.value,
  slug: catalogSlug.value,
  include: ["bookables"],
});

const allResources = computed(() => {
  const tenantFilter = tenantID.value
    ? (loc) => loc.tenantId === tenantID.value
    : () => true;

  return bookableStore.getBookables.filter(tenantFilter);
});
</script>

<template>
  <BookableSection :bookables="allResources" />
</template>
