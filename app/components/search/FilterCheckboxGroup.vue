<template>
  <div>
    <UCheckboxGroup
      v-model="model"
      :items="sortedItems.slice(0, numberOfVisibleItems)"
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

const sortedItems = computed(() => {
  return [...props.items].sort((a, b) => {
    if (a.count !== null && b.count !== null) {
      return b.count - a.count; // Descending by count
    }
    return a.label.localeCompare(b.label); // Ascending by label
  });
});
const numberOfVisibleItems = ref(5);

function onChange() {
  emit("change", model.value);
}
</script>

<style scoped></style>
