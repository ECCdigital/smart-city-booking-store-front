<template>
  <div>
    <UBadge
      v-for="(flag, i) in props.flags.slice(0, 10)"
      :key="i"
      icon="i-lucide-check"
      size="md"
      color="neutral"
      variant="ghost"
      style="padding-left: 0; padding-right: 15px"
    >
      {{ flag }}
    </UBadge>
    <UBadge
      v-if="flags.length > 10"
      size="md"
      color="neutral"
      variant="soft"
      style=""
      >+ {{ flags.length - 10 }} Weitere</UBadge
    >
  </div>
</template>
<script setup>
const props = defineProps({
  flags: {
    type: Array,
    required: true,
  },
});
</script>

<style scoped></style>