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
    slot: "event"
    /*ui: {
      root: "bg-white",
      list:"bg-white",
      trigger: "bg-red-500"
    }*/
  },
  {
    label: "Test",
    icon: "i-heroicons-beaker",
    value: `/catalog/${catalogSlug.value}/test`,
    slot: "test"
    /*ui: {
      root: "bg-white",
      list:"bg-white",
      trigger: "bg-red-500"
    }*/
  },
  {
    label: "Bookables",
    icon: "i-heroicons-ticket",
    value: `/catalog/${catalogSlug.value}/bookables`,
    slot: "bookables",
    ui: {

      /*root: "bg-white",
      list:"bg-white",
      trigger: "bg-red-500"*/
    }
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
const activeTabLabel = ref("")
</script>

<template>
  <div >
    <div class="mb-4">
      <UTabs
          :items="tabs"
          :content="false"
          :default-value="defaultTabIndex"
          variant="pill"
          size="lg"
          :ui="{
      trigger: 'text-sm font-medium rounded-none transition data-[state=active]:rounded-none data-[state=active]:bg-blue-500 hover:data-[state=inactive]:not-disabled:text-default',
    }"
          @update:modelValue="args => {router.push(args); activeTabLabel=args}"
      >
        <template #default="{ item }">
            <span></span>
            <span v-if="activeTabLabel === item.value">{{item.label}}</span>
        </template>
        <template #list-trailing>
          <div style="flex:1"></div>
          <UButton
              label="Login"
              color="primary"
              variant="ghost"
              @click="console.log('want login')"
          />
        </template>
      </UTabs>
      <UTabs
        :items="tabs"
        :content="false"
        :default-value="defaultTabIndex"
        variant="link"
        size="xl"
        class="my-tabs"
        style="background-color: var(--color-secondary)"
        @update:modelValue="args => {router.push(args); activeTabLabel=args}"
      >
        <template #default="{ item }">
          <div :style="activeTabLabel === item.value ? 'background-color:pink' : ''">
          <span></span>
          <span v-if="activeTabLabel === item.value">{{item.label}}</span>
          </div>
        </template>
        <template #list-trailing>
          <div style="flex:1"></div>
          <UButton
              label="Login"
              color="primary"
              variant="ghost"
              @click="console.log('want login')"
          />

        </template>
        </UTabs>

      <div class="bg-white text-black">
      .... {{activeTabLabel}}
    </div>
    </div>


    <NuxtPage />
  </div>
</template>

<style scoped>
/* Beispiel: Aktiver Tab */
.my-tabs .ui-tab-selected {
  background-color: hotpink
  /*@apply text-blue-600 border-b-2 border-blue-600 font-semibold;*/
}

/* Beispiel: Nicht aktiver Tab */
.my-tabs .ui-tab {
  background-color: lightblue;
  /*@apply text-gray-500 hover:text-gray-700 transition;*/
}

</style>
