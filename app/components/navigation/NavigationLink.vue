<template>
  <NuxtLink
    :to="tenantTo(tab.value)"
    :class="linkClass"
    :aria-label="tab.ariaLabel"
  >
    <div :class="stripeClass" />
    <Icon
      v-if="tab.icon"
      :name="tab.icon"
      :class="iconClass"
    />
    <span
      v-if="isActive"
      class="hidden sm:block"
      :class="labelClass"
      >{{ tab.label }}</span
    >
    <span
      v-if="!isActive"
      class="hidden sm:inline"
      :class="labelClass"
      >{{ tab.label }}</span
    >
  </NuxtLink>
</template>
<script setup>
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

// The tab knows only the header's variables from the theme stylesheet: the
// bar's text colour, and the colour, text and stripe of the active tab, which
// the stylesheet flips when the bar itself is secondary.
const linkClass = computed(() => [
  "flex items-center px-4 relative h-12",
  isActive.value
    ? "text-(--ui-header-active-contrast) bg-(--ui-header-active)"
    : "text-(--ui-header-contrast) bg-transparent",
]);
const stripeClass = computed(() => [
  "absolute top-0 left-0 w-full h-1",
  isActive.value ? "bg-(--ui-header-active-stripe)/40" : "bg-transparent",
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
