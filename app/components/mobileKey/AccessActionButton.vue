<template>
  <button
    type="button"
    :class="locationOptionClass"
    @click="() => emit('select')"
  >
    <div class="flex items-center gap-3 text-left w-full">
      <div
        class="flex flex-shrink-0 items-center justify-center rounded-lg w-8 h-8 bg-primary/10"
      >
        <UIcon :name="action.icon" class="w-5 h-5 text-primary font-bold" />
      </div>
      <div class="mr-1">
        <div class="font-medium text-gray-900 dark:text-gray-100">
          {{ props.action.label }}
        </div>
        <div class="text-sm text-gray-600 dark:text-gray-300">
          {{ action.description }}
        </div>
      </div>
    </div>
    <UIcon name="i-lucide-chevron-right" class="text-gray-400" />
  </button>
</template>
<script setup>
const props = defineProps({
  action: {
    type: Object,
    required: true,
  },
});
const emit = defineEmits(["select"]);

//Styles
const locationOptionClass =
  "w-full gap-2" +
  "border border-2 border-gray-200 dark:border-gray-700 " +
  "rounded-lg px-4 py-3 " +
  "flex items-center justify-between " +
  "hover:bg-gray-50 dark:hover:bg-gray-800 " +
  "transition-colors cursor-pointer";
</script>
<style scoped></style>
