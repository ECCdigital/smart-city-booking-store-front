<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useEventStore } from "~~/stores/event";

definePageMeta({ name: "catalog-events" });

const route = useRoute();
const slug = route.params.catalogSlug;

const { loadBundle } = useCatalogBundle();
const eventStore = useEventStore();

await loadBundle({ slug, include: ["events"] });

const { events } = storeToRefs(eventStore);
</script>

<template>
  <div>
    <h1>Events</h1>
    <ul v-if="events?.length">
      <li v-for="e in events" :key="e.id">
        <NuxtLink :to="`/catalog/${slug}/events/${e.id}`">
          {{ e.information.name || e.information.title || e.id }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else>Keine Events gefunden.</p>
  </div>
</template>
