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
    <NuxtPage />
  </div>
</template>

<style scoped></style>
