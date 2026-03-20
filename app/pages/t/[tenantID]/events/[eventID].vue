<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import DetailsArea from "~/components/search/DetailsArea.vue";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  name: "event-id",
  hero: {
    height: "sm",
    showOnMobile: true,
  },
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
  <div v-if="event">
    <DetailsArea :item="event" is-event/>
  </div>
  <p v-else>Event nicht gefunden.</p>
</template>

<style scoped></style>
