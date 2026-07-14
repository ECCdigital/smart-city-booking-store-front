<template>
  <UDropdownMenu
    v-if="variant === 'compact'"
    :items="dropdownItems"
    checked-icon="i-lucide-check"
    :ui="{
      content: 'ring-0 shadow-lg glass min-w-40',
      itemLeadingIcon: 'mt-0.5',
      itemTrailingIcon: 'mt-0.5 text-primary',
      item: 'before:bg-transparent data-highlighted:before:bg-transparent',
    }"
  >
    <UButton
      variant="ghost"
      :icon="activeOption.icon"
      :aria-label="`Darstellung: ${activeOption.label}`"
      class="h-12 px-3"
      :style="buttonStyle"
    />
  </UDropdownMenu>

  <UFieldGroup v-else class="flex justify-center">
    <UButton
      v-for="option in options"
      :key="option.value"
      :color="preference === option.value ? 'primary' : 'neutral'"
      :variant="preference === option.value ? 'solid' : 'soft'"
      :label="option.label"
      :icon="option.icon"
      :class="segmentedButtonClasses"
      @click="preference = option.value"
    />
  </UFieldGroup>
</template>

<script setup>
const props = defineProps({
  variant: {
    type: String,
    default: "compact",
    validator: (value) => ["compact", "segmented"].includes(value),
  },
  iconColor: {
    type: String,
    default: undefined,
  },
});

const { preference, options, activeOption } = useThemePreference();

const buttonStyle = computed(() =>
  props.iconColor ? { color: props.iconColor } : undefined,
);

const segmentedButtonClasses =
  "w-[33%] md:w-30 h-12 sm:h-8 text-lg sm:text-md flex justify-center items-center";

const dropdownItems = computed(() => [
  options.map((option) => ({
    label: option.label,
    icon: option.icon,
    type: "checkbox",
    checked: preference.value === option.value,
    class: preference.value === option.value ? "bg-primary/15 font-medium" : "",
    onSelect() {
      preference.value = option.value;
    },
  })),
]);
</script>
