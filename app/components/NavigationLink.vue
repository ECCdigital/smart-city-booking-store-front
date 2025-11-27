<template>
  <NuxtLink :to="tab.value" :class="linkClass">
    <div :class="stripeClass" />
    <Icon
      v-if="tab.icon"
      :name="tab.icon"
      :class="iconClass"
      :style="
        isActive ? { color: contrastToPrimary } : { color: contrastToSecondary }
      "
    />
    <span
      v-if="isActive"
      :class="labelClass"
      :style="
        isActive ? { color: contrastToPrimary } : { color: contrastToSecondary }
      "
      >{{ tab.label }}</span
    >
    <span
        v-if="!isActive"
        class="hidden sm:inline"
        :class="labelClass"
        :style="
        isActive ? { color: contrastToPrimary } : { color: contrastToSecondary }
      "
    >{{ tab.label }}</span
    >
  </NuxtLink>
</template>
<script setup>
import { useContrastColor } from "../composables/utils/useContrastColor.js";

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

const contrastToPrimary = computed(() =>
  useContrastColor().contrastToPrimary(),
);
const contrastToSecondary = computed(() =>
  useContrastColor().contrastToSecondary(),
);

const linkClass = computed(() => [
  "flex items-center px-4 relative h-12",
  isActive.value
    ? "text-[var(--color-on-primary)] bg-[var(--color-primary)]"
    : "bg-transparent",
]);
const stripeClass = computed(() => [
  "absolute top-0 left-0 w-full h-1",
  isActive.value ? "bg-[var(--color-secondary)]/40" : "bg-transparent",
]);
const iconClass = computed(() => ["text-lg mr-2"]);
const labelClass = computed(() => ["text-base"]);
</script>
<style scoped></style>
