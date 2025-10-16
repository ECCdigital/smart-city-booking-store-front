<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <VueDatePicker
      v-model="model"
      format="dd.MM.yyyy"
      :min-date="minDate"
      locale="de"
      month-name-format="long"
      cancelText="Abbrechen"
      selectText="OK"
      teleport-center
      :disabled="disabled"
      :enable-time-picker="false"
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
  minDate: {
    type: Date,
    default: new Date(),
  },
});
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}
</style>
