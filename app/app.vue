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
const { version: themeVersion, fontHref } = await useThemeBundle();

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

// The instance font is declared with `font-display: optional`: it is used only
// if it is there for the first paint, and without the preload it never is.
// `crossorigin` too on the same origin, or the font request would not reuse it.
useHead({
  link: computed(() =>
    fontHref.value
      ? [
          {
            rel: "preload",
            as: "font",
            type: "font/woff2",
            href: fontHref.value,
            crossorigin: "anonymous",
            fetchpriority: "high",
            tagPriority: "critical",
          },
        ]
      : [],
  ),
});
</script>
