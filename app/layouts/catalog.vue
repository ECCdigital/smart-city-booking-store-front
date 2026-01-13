<script setup>
import NavigationBar from "~/components/NavigationBar.vue";

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/css`,
    },
    {
      rel: "preload",
      href: `/api/theme/logo`,
      as: "image",
    },
  ],
});
</script>

<template>
  <div class="">
    <NavigationBar />
    <!-- Hero -->
    <!-- toDo - Hero anpassen für Dark-Mode  -->
    <HeroBackground
      variant="poly"
      theme="light"
      height="sm"
      :fade-bottom="false"
      class="px-10 py-15 justify-between  z-0"
    >
      <div class="flex">
        <div class="grid content-center max-w-220px">
          <p class="text-primary font-bold">Marktplatz</p>
          <p class="text-black text-3xl font-bold">
            Unsere Angebote und Veranstaltungen
          </p>
        </div>
        <div style="flex: 1; min-width: 15vw" />
        <div>
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            style="max-height: 7vh"
          />
        </div>
      </div>
    </HeroBackground>
    <NuxtPage />
  </div>
</template>

<style scoped></style>
