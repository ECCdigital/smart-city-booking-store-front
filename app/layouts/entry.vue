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

const { data: hero } = await useFetch("/api/theme/hero");
const colorMode = useColorMode();
</script>

<template>
  <div class="">
    <NavigationBar />
    <!-- Hero -->
    <HeroBackground
      variant="poly"
      :theme="colorMode.value === 'dark' ? 'dark' : 'light'"
      height="xl"
      :fade-bottom="false"
      class="px-10 py-15 justify-between z-0"
    >
      <div class="md:flex justify-between md:h-full">
        <div class="md:hidden mb-10 flex justify-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[6vh] dark:invert dark:hue-rotate-180"
          />
        </div>
        <div class="grid content-center max-w-220px text-center md:text-left">
          <p class="text-primary text-2xl font-bold">{{ hero?.title }}</p>
          <p class="text-black dark:text-white text-5xl font-bold">
            {{ hero?.subtitle }}
          </p>
        </div>
        <div class="hidden md:block" style="flex: 1; min-width: 15vw" />
        <div class="grid content-center">
          <img
            :src="`/api/theme/logo`"
            alt="logo"
            class="max-h-[7vh] hidden md:block dark:invert dark:hue-rotate-180"
          />
        </div>
      </div>
    </HeroBackground>

    <NuxtPage />
  </div>
</template>

<style scoped></style>
