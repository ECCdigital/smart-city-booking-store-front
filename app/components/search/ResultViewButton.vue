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
      @click="selectView(option.value)"
    />
  </UFieldGroup>
</template>

<script setup>

const { t } = useI18n();

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
