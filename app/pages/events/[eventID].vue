<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import { useAuthStore } from "~~/stores/auth.js";
import DetailsArea from "~/components/search/DetailsArea.vue";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  hero: {
    height: "sm",
    showOnMobile: true,
  },
});

const route = useRoute();
const eventStore = useEventStore();
const authStore = useAuthStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const eventID = computed(() => route.params.eventID);

const { loadDetail } = useCatalogBundle();

const event = computed(() => eventStore.getEventById(eventID.value));

async function refreshEventDetail({ force = false } = {}) {
  return;
  //TODO: rework
  if (import.meta.client) {
    await authStore.validateAuth(true);
  }

  await loadDetail({
    slug: catalogSlug.value || null,
    eventID: eventID.value,
    force,
  });
}

await refreshEventDetail();

const { t } = useI18n();
usePageTitle(() =>
  event.value?.title
    ? t("meta.pages.eventDetail", { title: event.value.title })
    : t("meta.pages.events"),
);
</script>

<template>
  <div class="container">
    <div v-if="event">
      <DetailsArea :item="event" is-event />
    </div>
    <div v-else class="text-center mt-10">
      <UIcon
        size="48"
        name="i-lucide-calendar-off"
        class="text-gray-400 mb-4"
      />
      <p class="text-gray-500">{{ $t("events.noEvent") }}</p>
      <UButton :label="$t('common.back')" to="/events" class="mt-4" />
    </div>
  </div>
</template>

<style scoped></style>
