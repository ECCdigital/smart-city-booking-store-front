<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useBookableStore } from "~~/stores/bookable.js";

definePageMeta({
  name: "catalog-bookables",
  layout: "catalog",
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

const { loadBundle } = useCatalogBundle();
const bookableStore = useBookableStore();

await loadBundle({ slug: catalogSlug.value, include: ["bookables"] });

const { bookables } = storeToRefs(bookableStore);
</script>

<template>
  <div>
    <h1 class="text-lg font-bold">Bookables...</h1>
    <ul v-if="bookables?.length">
      <li v-for="b in bookables" :key="b.id">
        <NuxtLink :to="`/bookables/${b.id}`">
          {{ b.name || b.title || b.id }}
        </NuxtLink>
      </li>
    </ul>
    <p v-else>Keine Bookables gefunden.</p>
  </div>
</template>
