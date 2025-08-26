<script setup>
import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  name: "catalog-slug",
});

const route = useRoute();
const router = useRouter();

const t = useI18n().t;

const catalogSlug = computed(() => {
  return route?.params?.catalogSlug;
});

const isValidCatalogSlug = (slug) => {
  const invalidSlugs = ["sw.js", "robots.txt", "favicon.ico", "manifest.json"];

  return !invalidSlugs.includes(slug) && !slug.includes(".");
};

const catalogStore = useCatalogStore();

const catalog = computed(() => {
  return catalogStore.getCatalog;
});

const tenantID = computed(() => {
  return catalog.value?.tenantId;
});

const bookableStore = useBookableStore();
const eventStore = useEventStore();

const tabs = computed(() => [
  {
    label: "Events",
    icon: "i-heroicons-calendar",
    value: "events",
  },
  {
    label: "Test",
    icon: "i-heroicons-beaker",
    value: "test",
  },
  {
    label: "Bookables",
    icon: "i-heroicons-ticket",
    value: "bookables",
  },
]);

const defaultTabIndex = computed(() => {
  const path = route.path;
  if (path.includes("/events")) return 0;
  if (path.includes("/test")) return 1;
  if (path.includes("/bookables")) return 2;
  return 0;
});

watch(
  catalogSlug,
  async (newCatalogSlug) => {
    if (newCatalogSlug && isValidCatalogSlug(newCatalogSlug)) {
      try {
        await catalogStore.fetchCatalog(newCatalogSlug);
      } catch (error) {
        throw createError({
          statusCode: 404,
          statusMessage: t("errors.noCatalog"),
        });
      }
    }
  },
  { immediate: true }
);

let isFetching = false;

watch(
  tenantID,
  async (newTenantID) => {
    if (newTenantID && !isFetching) {
      isFetching = true;
      try {
        await eventStore.fetchEvents(newTenantID);
        await bookableStore.fetchBookables(newTenantID);
      } catch (error) {
        throw createError({
          statusCode: 404,
          statusMessage: t("errors.noCatalog"),
        });
      } finally {
        isFetching = false;
      }
    }
  },
  { immediate: true }
);

const active = computed({
  get: () => {
    return route.name;
  },
  set: (value) => {
    router.push(value);
  },
});

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/${catalogSlug.value}.css`,
    },
  ],
});
</script>

<template>
  <div>
    <div class="mb-4">
      <UTabs
        v-model="active"
        :items="tabs"
        :content="false"
        :default-index="defaultTabIndex"
        class="w-full"
      >
      </UTabs>
    </div>

    <NuxtPage />
  </div>
</template>

<style scoped></style>
