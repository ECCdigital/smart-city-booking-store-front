<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <VueDatePicker
      v-model="model"
      time-picker
      format="HH:mm"
      cancelText="Abbrechen"
      selectText="OK"
      teleport-center
      :disabled="disabled"
      :action-row="{ showPreview: false }"
    />
  </UTooltip>
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";

const model = defineModel();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});
const now = ref(new Date());
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}
</style>
