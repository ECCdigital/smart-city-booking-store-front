<template>
  <!-- The empty state of the account lists (Buchungen, Schlüssel, Favoriten,
       Belege), so they look alike with no entries and with no matches. -->
  <div class="flex flex-col items-center justify-center py-16 text-center">
    <UIcon :name="icon" class="text-6xl text-gray-400 mb-4" />
    <h2
      v-if="title"
      class="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2"
    >
      {{ title }}
    </h2>
    <p class="text-gray-500 max-w-md" :class="{ 'mb-6': $slots.default }">
      {{ description }}
    </p>
    <slot />
  </div>
</template>

<script setup>
defineProps({
  icon: { type: String, required: true },
  title: { type: String, default: "" },
  description: { type: String, required: true },
});
</script>
