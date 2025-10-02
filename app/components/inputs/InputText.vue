<template>
  <UInput
    v-model="model"
    :icon="icon"
    size="lg"
    variant="ghost"
    :placeholder="placeholder"
    class="w-full bg-white dark:bg-white/10"
  />
</template>
<script setup>
const model = defineModel();

const props = defineProps({
  icon: {
    type: String,
    default: null,
  },
  placeholder: {
    type: String,
    default: null,
  },
});
</script>

<style scoped></style>
