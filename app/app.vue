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
const toaster = {
  position: "top-right",
};

useHead({
  htmlAttrs: {
    lang,
    dir,
  },
});

const instanceStore = useInstanceStore();

instanceStore.fetchInstance();
</script>
