<template>
  <div>
    <UBadge
      v-for="(flag, i) in props.flags.slice(0, 10)"
      :key="i"
      :icon="isDetailMode? 'i-lucide-hash' : 'i-lucide-check'"
      size="md"
      color="neutral"
      :variant="isDetailMode? 'solid' : 'ghost'"
      :class="badgeStyle"
    >
      {{ flag }}
    </UBadge>
    <UBadge
      v-if="flags.length > 10"
      size="md"
      color="neutral"
      variant="soft"
      :class="badgeStyle"
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
  isDetailMode: {
    type: Boolean,
    default: false,
  },
});

const badgeStyle = computed(() => {
  if(props.isDetailMode) {
    return "bg-gray-300 rounded-full text-sm mr-2 mb-2 text-black";
  } else {
    return "pl-1";
  }
})
</script>

<style scoped></style>