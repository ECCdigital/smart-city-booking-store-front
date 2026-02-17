<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import EventSection from "~/components/events/EventSection.vue";

definePageMeta({ name: "catalog-events", layout: "catalog" });

const { loadBundle } = useCatalogBundle();

const eventStore = useEventStore();
await loadBundle({ include: ["events"] });

const allEvents = computed(() => {
  return []//eventStore.getEvents;
});

</script>

<template>
  <EventSection :events="allEvents"/>
</template>
