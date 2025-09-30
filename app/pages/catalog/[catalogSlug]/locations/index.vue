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

const searchTerm = ref("");
const searchLocation = ref("");
const searchDate = ref("");

function testFunction() {
  console.log("coming soon...");
}
</script>

<template>
  <div>
    <!-- toDo - in eigene Komponente & responsive machen! -->
    <UCard
      variant=""
      class="bg-white mx-5 -mt-15 p-0 shadow-lg"
      :ui="{ root: 'p-0', body: 'p-0' }"
      style="position: relative"
    >
      <UInput
        v-model="searchTerm"
        icon="i-lucide-search"
        size="lg"
        variant="ghost"
        placeholder="Search..."
        class="w-full bg-white dark:bg-white/10"
      />
      <USeparator class="w-full" :ui="{ border: 'border-gray-400' }" />
      <UInput
        v-model="searchLocation"
        icon="i-lucide-map-pin"
        size="lg"
        variant="ghost"
        placeholder="Search..."
        class="w-full bg-white dark:bg-white/10"
      />
      <USeparator class="w-full" :ui="{ border: 'border-gray-400' }" />
      <UInput
        v-model="searchDate"
        icon="i-lucide-calendar-clock"
        size="lg"
        variant="ghost"
        placeholder="Search..."
        class="w-full bg-white dark:bg-white/10"
      />
      <!-- toDo - https://ui.nuxt.com/docs/components/calendar -->
      <!--  <UCalendar range v-model="searchDate" /> -->
      <UButton
        label="Suchen"
        class="w-full justify-center text-white"
        @click="console.log('suche Sinne des Lebens... ')"
      />
    </UCard>


    <!-- --------------------toDo - delete this testspace ------------------------------ -->
    <h1 class="text-lg font-bold">Orte</h1>
    <div class="text-xs">
      Begriff: {{ searchTerm }} || Ort: {{ searchLocation }} || Datum:
      {{ searchDate }}
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
