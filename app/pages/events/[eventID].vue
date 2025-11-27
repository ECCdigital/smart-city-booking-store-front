<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";

definePageMeta({
  layout: "bookable",
  middleware: ["catalog-auth"],
  name: "event-id",
});


const route = useRoute();
const eventStore = useEventStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const eventID = computed(() => route.params.eventID);

const { loadBundle } = useCatalogBundle();

const event = computed(() => {
  return eventStore.getEventById(eventID.value);
});

if (!event.value) {
  await loadBundle({ slug: catalogSlug.value, eventID: eventID.value });
}
</script>

<template>
  <article v-if="event">
    <h1>{{ event?.information?.name }}</h1>
  </article>
  <p v-else>Event nicht gefunden.</p>
</template>

<style scoped></style>
