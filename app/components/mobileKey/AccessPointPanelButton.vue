<template>
  <UButton
    label="Öffnen"
    trailing-icon="i-lucide-chevron-right"
    variant="ghost"
    color="primary"
    size="md"
    :disabled="denyAccess"
    :ui="{
      label: denyAccess ? 'text-gray-400' : '',
      trailingIcon: denyAccess ? 'text-gray-400' : '',
    }"
  />
</template>
<script setup>
const props = defineProps({
  denyAccess: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped></style>
