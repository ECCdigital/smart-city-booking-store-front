<template>
  <NuxtLink :to="tenantTo(tab.value)" :class="linkClass">
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
      class="hidden sm:block"
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

const { tenantTo, isActivePath } = useTenantRoute();

const isActive = computed(() => {
  return isActivePath(props.tab.value);
});

const { contrastToPrimary, contrastToSecondary } = useContrastColor();

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
const iconClass = computed(() => {
  if (props.tab.label) {
    return ["text-lg sm:mr-2"];
  } else {
    return ["text-lg"];
  }
});
const labelClass = computed(() => ["text-base"]);
</script>
<style scoped></style>
