<template>
  <div
    ref="containerRef"
    class="w-full"
    :style="{ '--picker-width': pickerWidth }"
  >
    <VueDatePicker
      v-model="model"
      format="dd.MM.yyyy"
      :min-date="new Date()"
      :locale="pickerLocale"
      month-name-format="long"
      :range="props.range"
      inline
      :enable-time-picker="false"
      auto-apply
      :dark="isDark"
      @range-start="onStartRange"
    />
  </div>
</template>

<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const props = defineProps({
  range: {
    type: Boolean,
    default: true,
  },
});

const model = defineModel();

// The picker names its months and weekdays through `Intl`, so it only needs the
// tag for the language being read. `locale` comes from `useI18n()` here rather
// than from inside the composable, so the computed re-runs on a language switch.
const { locale } = useI18n();
const { localeTag } = useFormatting();
const pickerLocale = computed(() => localeTag(locale.value));

const mode = useColorMode();
const isDark = computed(() => mode.value === "dark");

function onStartRange(startDate) {
  if (!props.range) return;
  model.value = [startDate, null];
}

const containerRef = ref(null);
const pickerWidth = ref("100%");

onMounted(() => {
  if (containerRef.value) {
    pickerWidth.value = `${containerRef.value.offsetWidth}px`;
  }
});
</script>

<style scoped>
:deep(.dp__menu),
:deep(.dp__main) {
  width: var(--picker-width) !important;
  max-width: 100%;
}

.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
}

:deep(.dp__theme_light) {
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: #fff;
}

:deep(.dp__theme_dark) {
  --dp-primary-color: var(--color-primary);
  --dp-primary-text-color: #fff;
}
</style>
