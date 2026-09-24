<template>
  <div v-if="props.steps.length > 0">
    <div class="flex gap-2 mb-3">
      <div
        v-for="(_, idx) in steps"
        :key="idx"
        class="flex-1 h-1 rounded-full transition-colors duration-300"
        :class="
          idx <= currentStep ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-700'
        "
      />
    </div>

    <!-- step 1: confirm location-->
    <div class="text-md font-semibold mb-2">
      Schritt {{ currentStep + 1 }} von {{ steps.length }} &middot;
      {{ steps[currentStep].label }}
    </div>
    <p class="text-sm text-gray-600 dark:text-gray-300 mb-6">
      {{ steps[currentStep].description }}
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  currentStep: {
    type: Number,
    required: true,
  },
  steps: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped></style>
