<script setup>
import NavigationBar from "~/components/NavigationBar.vue";
import {useBreakpointCheck} from "~/composables/utils/useBreakpointCheck.js";

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/css`,
    },
  ],
});

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
</script>

<template>
  <div class="bg-white dark:bg-gray-900">
    <NavigationBar />
    <!-- Hero -->
    <!-- toDo - Hero-Design für lg anpassen!  -->
    <!-- toDo - Hero anpassen für Dark-Mode  -->
    <div
        v-if="isGreaterThanMd"
        class="bg-gray-200  px-10 py-15 flex justify-between shadow-sm"
    >
      <div class="grid content-center max-w-220px">
        <p class="text-primary font-bold">Marktplatz</p>
        <p class="text-black text-3xl font-bold">
          Unsere Angebote und Veranstaltungen
        </p>
      </div>
      <div style="flex: 1; min-width: 15vw"/>
      <div>
        <img
            src="../assets/logo-kielregion.png"
            alt="Logo Kiel Region"
            class="text-center"
            style="height: 7vw"
        >
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
              src="../assets/logo-kielregion.png"
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
