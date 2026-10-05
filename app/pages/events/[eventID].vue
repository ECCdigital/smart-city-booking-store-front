<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import { useEventStore } from "~~/stores/event.js";
import { useAuthStore } from "~~/stores/auth.js";
import DetailsArea from "~/components/search/DetailsArea.vue";
import { titleOf } from "~/composables/search/offer";
import CatalogBreadcrumb from "~/components/navigation/CatalogBreadcrumb.vue";
import { tenantHintOf } from "~/utils/catalogDetail.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
});

const route = useRoute();
const { tenantTo } = useTenantRoute();
const eventStore = useEventStore();
const authStore = useAuthStore();

const catalogSlug = computed(() => route.params.catalogSlug);
const eventID = computed(() => route.params.eventID);

const { loadDetail } = useCatalogBundle();

const event = computed(() => eventStore.getEventById(eventID.value));

async function refreshEventDetail({ force = false } = {}) {
  if (import.meta.client) {
    await authStore.validateAuth(true);
  }

  await loadDetail({
    slug: catalogSlug.value || null,
    eventID: eventID.value,
    tenantHint: tenantHintOf(route.query),
    force,
  });
}

await refreshEventDetail();

const { t } = useI18n();
usePageTitle(() =>
  event.value && titleOf(event.value)
    ? t("meta.pages.eventDetail", { title: titleOf(event.value) })
    : t("meta.pages.events"),
);
</script>

<template>
  <div class="container">
    <CatalogBreadcrumb class="pt-4" />
    <div v-if="event">
      <DetailsArea :item="event" is-event />
    </div>
    <div v-else class="text-center mt-10">
      <UIcon
        size="48"
        name="i-lucide-calendar-off"
        class="text-gray-400 mb-4"
      />
      <p class="text-gray-500">{{ $t("errors.offerNotAvailable") }}</p>
      <UButton
        :label="$t('common.back')"
        :to="tenantTo({ path: '/search', query: { cat: 'event' } })"
        class="mt-4"
      />
    </div>
  </div>
</template>

<style scoped></style>
