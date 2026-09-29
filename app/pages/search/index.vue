<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { mergeOffers } from "~/composables/search/offer";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import ResultSection from "~/components/search/ResultSection.vue";

/**
 * The Result Page: every Offer of the Catalog, bookables and events together,
 * in list, grid or map view. `/bookables` and `/events` redirect here; the
 * Kind is narrowed with the `cat` query parameter.
 */
definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth", "catalog-guard"],
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.search"));

const route = useRoute();
const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();
const eventStore = useEventStore();

const catalogSlug = computed(() => route.params.catalogSlug || null);

await loadBundle({
  slug: catalogSlug.value,
  include: ["bookables", "events"],
});

const offers = computed(() =>
  mergeOffers(bookableStore.getBookables, eventStore.getEvents),
);
</script>

<template>
  <ResultSection :offers="offers" />
</template>
