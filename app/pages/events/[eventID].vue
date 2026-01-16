<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import DetailsArea from "~/components/search/DetailsArea.vue";

definePageMeta({
  layout: "bookable",
  middleware: ["catalog-auth"],
  name: "tenant-event-id",
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
    <DetailsArea :item="event" is-event />
  </div>
  <div v-else class="text-center mt-10">
    <UIcon size="48" name="i-lucide-calendar-off" class="text-gray-400 mb-4" />
    <p class="text-gray-500">{{ $t("events.noEvent") }}</p>
    <UButton :label="$t('common.back')" to="/locations" class="mt-4" />
  </div>
</template>

<style scoped></style>
