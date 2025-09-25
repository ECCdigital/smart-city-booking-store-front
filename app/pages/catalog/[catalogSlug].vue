<script setup>
import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import NavigationBar from "../../components/NavigationBar.vue";

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


let isFetching = false;


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
  <div >
    <NavigationBar/>

    <UPageHero
        title="Unsere Angebote und Veranstaltungen"
        :ui="{
          container: 'bg-[url(/assets/kiel_bootshafen.jpg)] contrast-70 p-10 pb-25 shadow-lg',
          title: 'text-2xl text-black',
        }"
    >
      <template #headline>
        <div class="flex justify-center ">
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
</style>
