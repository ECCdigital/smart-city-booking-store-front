<script setup>
import { useCatalogBundle } from "~/composables/useCatalogBundle.js";
import NavigationBar from "../../components/navigation/NavigationBar.vue";

definePageMeta({
  layout: "catalog",
  middleware: ["catalog-auth"],
});

const route = useRoute();
const t = useI18n().t;

const catalogSlug = computed(() => route?.params?.catalogSlug);

const { loadBundle } = useCatalogBundle();

try {
  await loadBundle({ slug: catalogSlug.value });
} catch (err) {
  if (err?.statusCode !== 401) {
    handleError({ statusCode: 404 }, t("errors.noCatalog"));
  }
}

usePageTitle();

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
  <div class="bg-gray-200 md:bg-white">
    <NavigationBar />

    <!-- Hero -->
    <div
      class="bg-gray-200 px-10 py-15 flex justify-between shadow-sm hidden md:block"
    >
      <div class="grid content-center max-w-220px">
        <p class="text-primary font-bold">Marktplatz</p>
        <p class="text-black text-3xl font-bold">
          Unsere Angebote und Veranstaltungen
        </p>
      </div>
      <div style="flex: 1; min-width: 15vw" />
      <div>
        <img
          src="../../assets/logo-kielregion.png"
          alt="Logo Kiel Region"
          class="text-center"
          style="height: 7vw"
        >
      </div>
    </div>
    <UPageHero
      title="Unsere Angebote und Veranstaltungen"
      :ui="{
        container:
          'bg-[url(/assets/kiel_bootshafen.jpg)] contrast-70 p-10 pb-25 shadow-lg',
        title: 'text-2xl text-black',
      }"
      class="z-0 md:hidden"
    >
      <template #headline>
        <div class="flex justify-center">
          <img
            src="../../assets/logo-kielregion.png"
            alt="Logo Kiel Region"
            class="text-center"
            style="height: 15vw"
          >
        </div>
      </template>
    </UPageHero>
    <NuxtPage />
  </div>
</template>

<style scoped></style>
