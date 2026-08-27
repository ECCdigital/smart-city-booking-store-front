<template>
  <div>
    <h1 class="text-2xl font-bold">{{ props.title }}</h1>

    <p v-if="description" class="mt-2 mb-5">
      {{ description }}
    </p>
  </div>
</template>
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
});
</script>

<style scoped></style>
