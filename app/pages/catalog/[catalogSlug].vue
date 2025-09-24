<script setup>
import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useCatalog } from "~/composables/api/useCatalog.js";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
  name: "catalog-slug",
});

const route = useRoute();
const router = useRouter();

const { fetchCatalogBundle } = useCatalog();

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

const { data, error } = await useAsyncData(
  `catalog:${catalogSlug.value}`,
  () => fetchCatalogBundle({ slug: catalogSlug.value }),
  { server: true }
);

if (error.value) {
  handleError({ statusCode: 404 }, t("errors.noCatalog"));
}

if (data.value?.catalog) {
  catalogStore.$patch({ catalog: data.value.catalog });
}
if (data.value?.bookables) {
  bookableStore.$patch({ bookables: data.value.bookables });
}

const tabs = computed(() => [
  {
    label: "Events",
    icon: "i-heroicons-calendar",
    value: `/catalog/${catalogSlug.value}/events`,
  },
  {
    label: "Test",
    icon: "i-heroicons-beaker",
    value: `/catalog/${catalogSlug.value}/test`,
  },
  {
    label: "Bookables",
    icon: "i-heroicons-ticket",
    value: `/catalog/${catalogSlug.value}/bookables`,
  },
]);

const defaultTabIndex = computed(() => {
  const path = route.path;
  if (path.includes("/events")) return 0;
  if (path.includes("/test")) return 1;
  if (path.includes("/bookables")) return 2;
  return 0;
});

let isFetching = false;

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
