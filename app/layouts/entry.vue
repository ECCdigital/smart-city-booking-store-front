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
</script>

<template>
  <div class="">
    <NavigationBar />
    <!-- Hero -->
    <HeroBackground
      variant="poly"
      theme="light"
      height="xl"
      :fade-bottom="false"
      class="px-10 py-15 justify-between z-0"
    >
      <div class="flex justify-between">
        <div class="grid content-center max-w-220px">
          <p class="text-primary text-2xl font-bold">{{ hero?.title }}</p>
          <p class="text-black text-5xl font-bold">
            {{ hero?.subtitle }}
          </p>
        </div>
        <div style="flex: 1; min-width: 15vw" />
        <img :src="`/api/theme/logo`" alt="logo" style="max-height: 7vh" />
      </div>
    </HeroBackground>

    <NuxtPage />
  </div>
</template>

<style scoped></style>
