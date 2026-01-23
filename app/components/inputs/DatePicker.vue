<template>
  <div ref="containerRef" class="w-full">
    <VueDatePicker
      v-model="model"
      format="dd.MM.yyyy"
      :min-date="new Date()"
      locale="de"
      month-name-format="long"
      range
      inline
      auto-apply
      :enable-time-picker="false"
      :action-row="{ showPreview: true, showSelect: false }"
      :ui="{
        menu: `!bg-transparent w-[${pickerWidth}]`,
      }"
      :dark="isDark"
      @range-start="onStartRange"
    />
  </div>
</template>

<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import "@vuepic/vue-datepicker/dist/main.css";

const model = defineModel();
const mode = useColorMode();
const isDark = computed(() => mode.value === "dark");

function onStartRange(startDate) {
  model.value = [startDate, null];
}

const containerRef = ref(null);
const pickerWidth = ref("450px");

onMounted(() => {
  if (containerRef.value) {
    pickerWidth.value = `${containerRef.value.offsetWidth}px`;
  }
});
</script>

<style scoped>
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
