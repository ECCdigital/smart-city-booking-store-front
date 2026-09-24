<template>
  <UFieldGroup orientation="horizontal" class="rounded-full overflow-hidden">
    <UButton
      v-for="option in viewOptions"
      :key="option.value"
      :label="option.label"
      :icon="option.icon"
      :color="view === option.value ? 'secondary' : 'neutral'"
      :variant="view === option.value ? 'solid' : 'soft'"
      class="first:rounded-l-full last:rounded-r-full"
      :style="
        view === option.value ? { color: contrastToSecondary } : undefined
      "
      @click="selectView(option.value)"
    />
  </UFieldGroup>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { t } = useI18n();

// Only the selected button is filled with the secondary colour, so only it
// needs that colour's contrast; the other one keeps the neutral foreground
// Nuxt UI picks against the page. The icon follows through `currentColor`.
const { contrastToSecondary } = useContrastColor();

const view = defineModel({
  type: String,
  required: true,
});

const emit = defineEmits(["setView"]);

// Computed, not a plain array: `t()` read once at setup would freeze the labels
// in the language the toggle was mounted in.
const viewOptions = computed(() => [
  {
    value: "list",
    label: t("results.listView"),
    icon: "i-lucide-list",
  },
  {
    value: "map",
    label: t("results.mapView"),
    icon: "i-lucide-map-pin",
  },
]);

const selectView = (value) => {
  view.value = value;
  emit("setView", value);
};

onMounted(() => {
  if (!viewOptions.value.some((opt) => opt.value === view.value)) {
    console.log(
      "Invalid view detected, defaulting to 'list'. Current value:",
      view.value,
    );
    selectView("list");
  }
});
</script>

<style scoped></style>
