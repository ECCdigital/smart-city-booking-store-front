<script setup>
import NavigationBar from "~/components/NavigationBar.vue";

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/css`,
    },
  ],
});
</script>

<template>
  <div class="bg-gray-200">
    <NavigationBar />
    <UPageHero
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
          />
        </div>
      </template>
    </UPageHero>
    <NuxtPage />
  </div>
</template>

<style scoped></style>
