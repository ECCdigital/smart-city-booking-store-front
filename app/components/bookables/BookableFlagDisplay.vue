<template>
  <div>
    <UBadge
      v-for="(item, i) in visibleItems"
      :key="i"
      :icon="isDetailMode ? '' : 'i-lucide-check'"
      size="md"
      color="neutral"
      :variant="isDetailMode ? 'solid' : 'ghost'"
      :class="badgeStyle"
    >
      {{ item }}
    </UBadge>
    <UBadge
      v-if="hiddenCount > 0 && !showAll"
      size="md"
      color="neutral"
      variant="soft"
      :class="[badgeStyle, 'cursor-pointer']"
      @click="showAll = true"
      >+ {{ hiddenCount }} Weitere</UBadge
    >
    <UBadge
      v-else-if="showAll && allItems.length > maxToShow"
      size="md"
      color="neutral"
      variant="soft"
      :class="[badgeStyle, 'cursor-pointer']"
      @click="showAll = false"
      >Weniger anzeigen</UBadge
    >
  </div>
</template>
<script setup>
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

const props = defineProps({
  flags: {
    type: Array,
    default: () => [],
  },
  badges: {
    type: Array,
    default: () => [],
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

const { isGreaterThanMd } = useBreakpointCheck();

const allItems = computed(() => [...(props.flags || []), ...(props.badges || [])]);

const showAll = ref(false);

const maxToShow = computed(() => {
  if (props.isDetailMode && !isGreaterThanMd.value) {
    return 5;
  }
  return 10;
});

const visibleItems = computed(() => {
  if (showAll.value) return allItems.value;
  return allItems.value.slice(0, maxToShow.value);
});

const hiddenCount = computed(() => allItems.value.length - visibleItems.value.length);
</script>

<style scoped></style>
