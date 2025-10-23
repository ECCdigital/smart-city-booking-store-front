<script setup>
import { useCatalogStore } from "~~/stores/catalog.js";
import { useBookableStore } from "~~/stores/bookable.js";
import { useEventStore } from "~~/stores/event.js";
import { useCatalog } from "~/composables/api/useCatalog.js";
import NavigationBar from "../../components/NavigationBar.vue";
import { useBreakpointCheck } from "../../composables/utils/useBreakpointCheck.js";

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

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());

const { data, error } = await useAsyncData(
  `catalog:${catalogSlug.value}`,
  () => fetchCatalogBundle({ slug: catalogSlug.value }),
  { server: true },
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
  <div :class="isGreaterThanMd ? 'bg-white' : 'bg-gray-200'">
    <NavigationBar />

    <!-- Hero -->
    <div
      v-if="isGreaterThanMd"
      class="bg-gray-200 px-10 py-15 flex justify-between shadow-sm"
    >
      <div class="grid content-center max-w-220px">
        <p class="text-primary font-bold">Marktplatz</p>
        <p class="text-black text-3xl font-bold">
          Unsere Angebote und Veranstaltungen
        </p>
      </div>
      <div style="flex: 1; min-width: 15vw"></div>
      <div>
        <img
          src="../../assets/logo-kielregion.png"
          alt="Logo Kiel Region"
          class="text-center"
          style="height: 7vw"
        />
      </div>
    </div>
    <UPageHero
      v-else
      title="Unsere Angebote und Veranstaltungen"
      :ui="{
        container:
          'bg-[url(/assets/kiel_bootshafen.jpg)] contrast-70 p-10 pb-25 shadow-lg',
        title: 'text-2xl text-black',
      }"
      class="z-0"
    >
      <template #headline>
        <div class="flex justify-center">
          <img
            src="../../assets/logo-kielregion.png"
            alt="Logo Kiel Region"
            class="text-center"
            style="height: 15vw"
          />
        </div>
      </template>
    </UPageHero>
    <NuxtPage />
  </div>
</template>

<style scoped></style>
