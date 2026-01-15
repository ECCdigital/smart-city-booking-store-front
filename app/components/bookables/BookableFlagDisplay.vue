<template>
  <div>
    <UBadge
      v-for="(flag, i) in props.flags.slice(0, numberOfFlagsToShow)"
      :key="i"
      :icon="isDetailMode ? 'i-lucide-hash' : 'i-lucide-check'"
      size="md"
      color="neutral"
      :variant="isDetailMode ? 'solid' : 'ghost'"
      :class="badgeStyle"
    >
      {{ flag }}
    </UBadge>
    <UBadge
      v-if="flags.length > numberOfFlagsToShow"
      size="md"
      color="neutral"
      variant="soft"
      :class="badgeStyle"
      >+ {{ flags.length - numberOfFlagsToShow }} Weitere</UBadge
    >
  </div>
</template>
<script setup>
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

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
  if (props.isDetailMode) {
    return "bg-gray-300 rounded-full text-sm mr-2 mb-2 text-black";
  } else {
    return "pl-1";
  }
});

const isGreaterThanMd = computed(() => useBreakpointCheck().isGreaterThanMd());

const numberOfFlagsToShow = computed(() => {
  if (props.isDetailMode && !isGreaterThanMd.value) {
    return Math.min(props.flags.length, 5);
  }
  return Math.min(props.flags.length, 10);
});
</script>

<style scoped></style>
