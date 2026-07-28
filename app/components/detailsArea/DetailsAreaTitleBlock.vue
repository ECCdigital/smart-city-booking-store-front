<template>
  <div class="md:flex justify-between gap-4">
    <div>
      <p class="text-sm font-bold text-gray-400 dark:text-gray-600">
        {{ tenantName }}
      </p>
      <h2 class="text-2xl font-bold">{{ title }}</h2>
    </div>
    <div class="flex items-center space-x-1">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  tenantName: { type: String, default: "" },
  title: { type: String, default: "" },
});
</script>

<style scoped></style>
