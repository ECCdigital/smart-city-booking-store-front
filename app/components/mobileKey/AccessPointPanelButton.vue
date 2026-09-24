<template>
  <UButton
    :label="$t('mobileKey.openAction')"
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
defineProps({
  denyAccess: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped></style>
