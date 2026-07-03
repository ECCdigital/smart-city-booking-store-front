<template>
  <div>
    <UButton
      v-if="canGoBack"
      label="Zurück"
      icon="i-lucide-arrow-left"
      class="justify-center px-5 bg-gray-300 text-black"
      :style="{ cursor: 'pointer' }"
      @click="$router.back()"
    />
  </div>
</template>
<script setup>
const canGoBack = computed(() => window?.history.length > 1);
</script>

<style scoped></style>
