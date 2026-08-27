<template>
  <div class="space-y-3">
    <div>
      <p class="text-sm font-bold text-gray-400 dark:text-gray-600">
        {{ tenantName }}
      </p>
      <h2 class="text-2xl font-bold">{{ title }}</h2>
    </div>
    <div class="flex flex-wrap items-center gap-3">
      <slot name="back" />
      <div class="ml-auto flex items-center space-x-2">
        <slot name="actions" />
      </div>
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
