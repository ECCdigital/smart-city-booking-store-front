<template>
  <div>
    <UCheckboxGroup
      v-model="model"
      :items="visibleItems"
      :ui="{ label: 'text-base' }"
      @change="onChange"
    >
      <template #label="{ item }">
        <div class="flex">
          {{ item.label }}
          <span
            v-if="item.count !== null && item.count !== undefined"
            class="text-gray-500 ml-2 text-sm content-center"
            >({{ item.count }})</span
          >
        </div>
      </template>
    </UCheckboxGroup>
    <div v-if="props.useMoreButton" class="flex justify-center w-full mt-2">
      <UButton
        v-if="numberOfVisibleItems < items.length"
        label="Alle anzeigen"
        variant="ghost"
        @click="
          () => {
            numberOfVisibleItems = items.length;
          }
        "
      />
      <UButton
        v-if="numberOfVisibleItems === items.length"
        label="Weniger anzeigen"
        variant="ghost"
        @click="
          () => {
            numberOfVisibleItems = 5;
          }
        "
      />
    </div>
  </div>
</template>
<script setup>
const model = defineModel({
  type: [String, Array],
  required: true,
});

const props = defineProps({
  items: {
    type: Array,
    default: () => [],
  },
  useMoreButton: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(["change"]);

const numberOfVisibleItems = ref(5);

function isSelected(value) {
  return Array.isArray(model.value)
    ? model.value.includes(value)
    : model.value === value;
}

// Items keep the order they arrive in, so the list does not jump. An option
// without hits is greyed out unless it is selected, so it can still
// be deselected.
const visibleItems = computed(() =>
  props.items.slice(0, numberOfVisibleItems.value).map((item) => ({
    ...item,
    disabled: item.count === 0 && !isSelected(item.value),
  })),
);

function onChange() {
  emit("change", model.value);
}
</script>

<style scoped></style>
