<template>
  <UFieldGroup orientation="horizontal" class="rounded-lg overflow-hidden">
    <UTooltip
      v-for="option in viewOptions"
      :key="option.value"
      :text="option.label"
    >
      <UButton
        :icon="option.icon"
        :color="view === option.value ? 'secondary' : 'neutral'"
        :variant="view === option.value ? 'solid' : 'soft'"
        class="first:rounded-l-lg last:rounded-r-lg px-3"
        :style="
          view === option.value ? { color: 'var(--ui-secondary-contrast)' } : undefined
        "
        @click="selectView(option.value)"
      />
    </UTooltip>
  </UFieldGroup>
</template>

<script setup>
const { t } = useI18n();


const view = defineModel({
  type: String,
  required: true,
});

const emit = defineEmits(["setView"]);

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
