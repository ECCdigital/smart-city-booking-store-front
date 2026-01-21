<script setup>
import NavigationBar from "~/components/NavigationBar.vue";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

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

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());
const colorMode = useColorMode();

const theme = computed(() => {
  if (colorMode.value === "dark") return "dark";
  if (colorMode.value === "light") return "light";
  return "light";
});
</script>

<template>
  <div>
    <NavigationBar />
    <!-- Hero -->
    <HeroBackground
      variant="poly"
      :theme="theme"
      :height="isGreaterThanMd ? 'sm' : 'md'"
      :fade-bottom="false"
      class="px-10 py-10 md:py-15 justify-between z-0"
    >
      <div class="md:flex">
        <div class="md:hidden mb-5 flex justify-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="text-center max-h-[5vh] dark:invert dark:hue-rotate-180"
          />
        </div>
        <div class="grid content-center max-w-220px text-center md:text-left">
          <p class="text-primary font-bold text-sm md:text-md">Marktplatz</p>
          <p class="text-black dark:text-white text-xl md:text-3xl font-bold">
            Unsere Angebote und Veranstaltungen
          </p>
        </div>
        <div class="hidden md:block" style="flex: 1; min-width: 15vw" />
        <div class="grid content-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="text-center md:max-h-[7vh] hidden md:block dark:invert dark:hue-rotate-180"
          />
        </div>
      </div>
    </HeroBackground>
    <NuxtPage />
  </div>
</template>

<style scoped></style>
