<template>
  <div class="my-3">
    <UCheckbox
        v-if="filterType === 'checkbox'"
        v-model="localValue"
        :label="definition.caption"
        @change="emitChange"
    />

    <template v-else>
      <p class="mb-3">{{ definition.caption }}</p>

      <UCheckboxGroup
          v-if="filterType === 'select'"
          v-model="localValue"
          :items="meta.options"
          :ui="{ label: 'text-base' }"
          @change="emitChange"
      >
        <template #label="{ item }">
          <div class="flex">
            {{ item.label }}
            <span class="text-gray-500 ml-2 text-sm content-center">
              ({{ item.count }})
            </span>
          </div>
        </template>
      </UCheckboxGroup>

      <div v-else-if="filterType === 'slider'">
        <p class="mb-3 mx-2">{{ meta.min }} – {{ localValue }}</p>
        <FilterHistogramSlider
            v-model="localValue"
            mode="single"
            :min="meta.min"
            :max="meta.max"
            :step="meta.step || 1"
            :values="meta.values || []"
            @change="emitChange"
        />
      </div>

      <div v-else-if="filterType === 'range'">
        <p class="mb-3 mx-2">{{ localValue[0] }} – {{ localValue[1] }}</p>
        <FilterHistogramSlider
            v-model="localValue"
            mode="range"
            :min="meta.min"
            :max="meta.max"
            :step="meta.step || 1"
            :values="meta.values || []"
            @change="emitChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import FilterHistogramSlider from "~/components/search/FilterHistogramSlider.vue";

const props = defineProps({
  definition: { type: Object, required: true },
  filterType: { type: String, required: true },
  meta: { type: Object, required: true },
  modelValue: { type: [Array, Number, String, Boolean, Object], default: null },
});
const emit = defineEmits(["update:modelValue", "change"]);

function defaultFor(type, meta) {
  if (type === "select") return [];
  if (type === "checkbox") return false;
  if (type === "slider" || type === "range") return meta.values;
  return null;
}

const localValue = ref(
    props.modelValue ?? defaultFor(props.filterType, props.meta),
);

watch(
    () => props.modelValue,
    (v) => {
      if (v !== undefined && v !== null) localValue.value = v;
    },
);

function emitChange() {
  emit("update:modelValue", localValue.value);
  emit("change");
}
</script>