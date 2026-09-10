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
      <FilterCheckboxGroup
          v-if="filterType === 'select'"
          v-model="localValue"
          :items="meta.options"
          use-more-button
          @change="emitChange"
      />

      <div v-else-if="filterType === 'slider'">
        <p class="mb-3 mx-2">
          {{ getSliderOption(meta.min) }} – {{ getSliderOption(localValue) }}
        </p>
        <FilterHistogramSlider
          v-model="localValue"
          mode="single"
          :min="meta.min"
          :max="meta.max"
          :step="meta.step || 1"
          :values="meta.bars || []"
          :use-text="definition.inputType === 'select'"
          @change="emitChange"
        />
      </div>

      <div v-else-if="filterType === 'range'">
        <p class="mb-3 mx-2">
          {{ getSliderOption(localValue[0]) }} –
          {{ getSliderOption(localValue[1]) }}
        </p>
        <FilterHistogramSlider
          v-model="localValue"
          mode="range"
          :min="meta.min"
          :max="meta.max"
          :step="meta.step || 1"
          :values="meta.bars || []"
          :use-text="definition.inputType === 'select'"
          @change="emitChange"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import FilterHistogramSlider from "~/components/search/FilterHistogramSlider.vue";
import FilterCheckboxGroup from "~/components/search/FilterCheckboxGroup.vue";

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
  if (type === "slider" || type === "range") {
    return meta.values;
  }
  return null;
}

const localValue = ref(
  props.modelValue ?? defaultFor(props.filterType, props.meta),
);
watch(
  () => props.modelValue,
  (v) => {
    localValue.value = v ?? defaultFor(props.filterType, props.meta);
  },
);

function getSliderOption(numericValue) {
  if (props.definition.inputType === "select") {
    const index = numericValue - 1; // Assuming slider values start at 1 for the first option
    return props.definition.options[index]?.caption || numericValue;
  }
  return numericValue;
}

function emitChange() {
  emit("update:modelValue", localValue.value);
  emit("change");
}
</script>
