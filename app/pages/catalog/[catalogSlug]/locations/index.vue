<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle";
import { useBookableStore } from "~~/stores/bookable";

definePageMeta({ name: "catalog-locations" });

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const allLocations = computed(() => {
  let locations = bookableStore.getLocations;
  return locations.concat(bookableStore.getRooms);
});
const { bookables } = storeToRefs(bookableStore);
</script>

<template>
  <div>
    <h1 class="text-lg font-bold">Orte</h1>
    <USeparator />
      <USeparator />
      {{ bookables[5] }}
    </div>
    <USeparator />
    <ul v-if="allLocations?.length" class="bg-red-200 text-black">
      <li v-for="b in allLocations" :key="b.id">
        <NuxtLink :to="`/catalog/${catalogSlug}/locations/${b.id}`">
          {{ b.name || b.title || b.id }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else>Keine Locations gefunden.</p>
    <USeparator />
  </div>
</template>

<style scoped></style>
