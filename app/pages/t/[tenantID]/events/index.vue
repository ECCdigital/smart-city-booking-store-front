<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import EventSection from "~/components/events/EventSection.vue";

definePageMeta({ name: "tenant-catalog-events", layout: "catalog" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);
const tenantID = computed(() => route.params.tenantID);

const { loadBundle } = useCatalogBundle();
const eventStore = useEventStore();
await loadBundle({
  tenantID: tenantID.value,
  catalogSlug: catalogSlug.value,
  include: ["events"],
});

const allEvents = computed(() => {
  const tenantFilter = tenantID.value
    ? (loc) => loc.tenantId === tenantID.value
    : () => true;
  return eventStore.getEvents.filter(tenantFilter);
});
</script>

<template>
  <EventSection :events="allEvents" />
</template>
