<script setup lang="ts">
</script>

<template>
  <div class="flex flex-col items-center justify-center py-16">
    <UIcon name="i-lucide-calendar-x" class="text-6xl text-gray-400 mb-4" />
    <h2 class="text-xl font-semibold text-gray-700 mb-2">
      {{ $t("booking.emptyTitle") }}
    </h2>
    <p class="text-gray-500 mb-6">
      {{ $t("booking.emptyDescription") }}
    </p>
  </div>
</template>

<style scoped></style>
