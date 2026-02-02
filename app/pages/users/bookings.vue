<script setup>
import {useAuthStore} from "~~/stores/auth";

definePageMeta({
  layout: "catalog",
});

const user = computed(() => useAuthStore().getUser);

</script>

<template>
  <div class="px-5">
    <h2 class="text-2xl font-bold">Ihre Buchungen</h2>
    {{ user }}
  </div>
</template>

<style scoped>

</style>