<template>
  <div class="flex my-5">
    <div class="content-center">
      <UAvatar icon="i-lucide-info" size="md" class="m-2" />
    </div>
    <div>
      <p class="font-bold">{{props.title}}</p>
      <p v-if="description" class="text-sm">{{description}}</p>
    </div>
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
    default: null
  },
})
</script>
<style scoped></style>