<template>
  <div>
    <UButton
      v-if="canGoBack"
      :label="$t('common.back')"
      icon="i-lucide-arrow-left"
      color="primary"
      variant="outline"
      class="justify-center px-5"
      @click="$router.back()"
    />
  </div>
</template>
<script setup>
const canGoBack = computed(
  () => import.meta.client && window.history.length > 1,
);
</script>

<style scoped></style>
