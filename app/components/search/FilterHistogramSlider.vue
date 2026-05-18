<template>
  <div class="mx-2">
    <div
        v-if="hasBars"
        class="flex items-end justify-between mx-2"
        style="width: 100%; padding-right: 15px"
    >
      <div
          v-for="(count, index) in bars"
          :key="index"
          class="w-full bg-primary opacity-40 mr-1 transition-opacity"
          :class="{ 'opacity-80': isBarActive(index) }"
          style="max-height: 50px"
          :style="{
          height: (count / maxBar) * 50 + 'px',
        }"
      />
    </div>

    <USlider
        v-model="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @change="onChange"
    />
  </div>
</template>

<script setup>
const modelValue = defineModel({
  type: [Number, Array],
  required: true,
});
const props = defineProps({
  // Raw numeric values from your dataset (e.g. prices, distances)
  values: {
    type: Array,
    default: () => [],
  },
  min: { type: Number, required: true },
  max: { type: Number, required: true },
  step: { type: Number, default: 1 },
  // 'range' = two thumbs [a, b], 'single' = one thumb
  mode: {
    type: String,
    default: "single",
    validator: (v) => ["single", "range"].includes(v),
  },
  // Optional: number of histogram bars (defaults to range/step)
  barCount: {
    type: Number,
    default: null,
  },
});

const emit = defineEmits(["change"]);

const effectiveBarCount = computed(() => {
  if (props.barCount) return props.barCount;
  const span = props.max - props.min;
  if (span <= 0 || props.step <= 0) return 1;
  return Math.max(1, Math.ceil(span / props.step));
});

const bars = computed(() => {
  const count = effectiveBarCount.value;
  const buckets = new Array(count).fill(0);
  const range = props.max - props.min;

  if (range <= 0 || !props.values?.length) return buckets;

  for (const raw of props.values) {
    if (raw == null || isNaN(raw)) continue;

    if (raw <= props.min) {
      buckets[0]++;
      continue;
    }

    const idx = Math.min(
        Math.floor(((raw - props.min) / range) * count),
        count - 1,
    );
    buckets[idx]++;
  }

  return buckets;
});

const maxBar = computed(() => Math.max(...bars.value, 1));
const hasBars = computed(
    () => bars.value.length > 0 && bars.value.some((b) => b > 0),
);

function isBarActive(index) {
  const range = props.max - props.min;
  if (range <= 0) return false;

  const barStart = props.min + (index / effectiveBarCount.value) * range;
  const barEnd = props.min + ((index + 1) / effectiveBarCount.value) * range;

  if (props.mode === "range") {
    const [lo, hi] = localValue.value;
    return barEnd >= lo && barStart <= hi;
  }
  return barEnd <= localValue.value;
}

function onChange() {
  emit("change");
}
</script>