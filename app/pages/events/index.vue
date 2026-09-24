<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import EventSection from "~/components/events/EventSection.vue";

definePageMeta({
  layout: "catalog",
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.events"));

const route = useRoute();
const { loadBundle } = useCatalogBundle();
const eventStore = useEventStore();

const catalogSlug = computed(() => route.params.catalogSlug || null);

await loadBundle({ slug: catalogSlug.value, include: ["events"] });

const allEvents = computed(() => {
  return eventStore.getEvents;
});
</script>

<template>
  <EventSection :events="allEvents" />
</template>
