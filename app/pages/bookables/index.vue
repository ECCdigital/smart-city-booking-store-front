<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";
import BookableSection from "~/components/bookables/BookableSection.vue";

definePageMeta({
  layout: "catalog",
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.bookables"));

const route = useRoute();
const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

const catalogSlug = computed(() => route.params.catalogSlug || null);

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allBookables = computed(() => {
  return bookableStore.getBookables;
});
</script>

<template>
  <BookableSection :bookables="allBookables" />
</template>
