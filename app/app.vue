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
import { useInstanceStore } from "~~/stores/instance.js";

const { locale } = useI18n();

const lang = computed(() => locales[locale.value].code);
const dir = computed(() => locales[locale.value].dir);
const toaster = { position: "bottom-right" };

useHead({
  htmlAttrs: { lang, dir },
  link: [{ rel: "stylesheet", href: `/api/theme/css` }],
});

const instanceStore = useInstanceStore();

try {
  await instanceStore.fetchInstance();
} catch (error) {
  console.error("[app.vue] fetchInstance failed:", error);
}
</script>
