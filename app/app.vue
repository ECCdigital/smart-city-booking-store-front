<!-- app.vue -->
<template>
  <UApp :locale="locales[locale]" :toaster="toaster">
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
import * as locales from "@nuxt/ui/locale";

const { locale } = useI18n();
const siteName = useSiteName();
const { version: themeVersion } = await useThemeBundle();

const themeCssHref = computed(() => `/api/theme/css${themeVersion.value}`);
const faviconHref = computed(() => `/api/theme/favicon${themeVersion.value}`);

const lang = computed(() => locales[locale.value].code);
const dir = computed(() => locales[locale.value].dir);
const toaster = { position: "bottom-right" };

useHead({
  htmlAttrs: { lang, dir },
  titleTemplate: (titleChunk) => {
    const site = siteName.value;
    if (!titleChunk || titleChunk === site) {
      return site;
    }
    return `${titleChunk} | ${site}`;
  },
  link: [
    { rel: "stylesheet", href: themeCssHref },
    { rel: "icon", href: faviconHref, key: "favicon" },
  ],
});
</script>
