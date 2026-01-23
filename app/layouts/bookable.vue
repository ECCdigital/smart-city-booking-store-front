<script setup>
import NavigationBar from "~/components/NavigationBar.vue";

useHead({
  link: [
    {
      rel: "preload",
      href: `/api/theme/logo`,
      as: "image",
    },
  ],
});
</script>

<template>
  <div>
    <NavigationBar />

    <!-- toDo - adjust header for details -->
    <HeroBackground
      variant="poly"
      theme="light"
      height="sm"
      class="px-10 py-15 justify-between shadow-sm hidden md:block"
    >
      <div class="flex">
        <div class="grid content-center max-w-220px">
          <p class="text-primary font-bold">Marktplatz</p>
          <p class="text-black dark:text-white text-xl md:text-3xl font-bold">
            Unsere Angebote und Veranstaltungen
          </p>
        </div>
        <div style="flex: 1; min-width: 15vw" />
        <div>
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="text-center dark:invert dark:hue-rotate-180"
            style="max-height: 7vh"
          />
        </div>
      </div>
    </HeroBackground>

    <NuxtPage />
  </div>
</template>

<style scoped></style>
