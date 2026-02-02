<template>
  <div class="md:container bg-neutral-50 dark:bg-gray-950 md:flex h-[60vh] pt-7">
    <div class="px-5">
        <h2 class="text-2xl font-bold">Einstellungen</h2>
        {{ user }}

    </div>
  </div>
</template>
<script setup>
import {useAuthStore} from "~~/stores/auth.js";

definePageMeta({
  name: "settings",
  layout: "catalog",
});

const user = computed(() => useAuthStore().getUser);
</script>
<style scoped>

</style>