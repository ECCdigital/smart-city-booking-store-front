<template>
  <NuxtLink :to="tab.value" :class="linkClass">
    <div :class="stripeClass" />
    <Icon v-if="tab.icon" :name="tab.icon" :class="iconClass" />
    <span v-if="isActive || isGreaterThanSm" :class="labelClass">{{
      tab.label
    }}</span>
  </NuxtLink>
</template>
<script setup>
import { useWindowSize } from "@vueuse/core";
import { useBreakpointCheck } from "../composables/utils/useBreakpointCheck.js";
const props = defineProps({
  tab: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const isActive = computed(() => {
  return route.path === props.tab.value;
});

const isGreaterThanSm = computed(() => useBreakpointCheck().isGreaterThanSm);

const linkClass = computed(() => [
  "flex items-center px-4 relative h-12",
  isActive.value ? "bg-[var(--color-primary)]" : "bg-transparent",
]);
const stripeClass = computed(() => [
  "absolute top-0 left-0 w-full h-1",
  isActive.value ? "bg-[var(--color-secondary)]/40" : "bg-transparent",
]);
const iconClass = computed(() => ["text-white text-lg mr-2"]);
const labelClass = computed(() => ["text-white text-base"]);
</script>
<style scoped></style>
