<template>
  <UFieldGroup orientation="horizontal" class="rounded-lg overflow-hidden">
    <UButton
      v-for="option in viewOptions"
      :key="option.value"
      :label="option.label"
      :icon="option.icon"
      :color="view === option.value ? 'secondary' : 'neutral'"
      :variant="view === option.value ? 'solid' : 'soft'"
      class="first:rounded-l-lg last:rounded-r-lg px-3"
      :style="
        view === option.value ? { color: contrastToSecondary } : undefined
      "
      @click="selectView(option.value)"
    />
  </UFieldGroup>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToSecondary } = useContrastColor();

const view = defineModel({
  type: String,
  required: true,
});

const emit = defineEmits(["setView"]);

const viewOptions = computed(() => [
  {
    value: "list",
    //label: t("results.listView"),
    icon: "i-lucide-list",
  },
  {
    value: "map",
    //label: t("results.mapView"),
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
