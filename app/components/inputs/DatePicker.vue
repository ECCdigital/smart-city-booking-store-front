<template>
  <VueDatePicker
    v-model="model"
    format="dd.MM.yyyy"
    :min-date="new Date()"
    locale="de"
    month-name-format="long"
    teleport-center
    range
    inline
    auto-apply
    :enable-time-picker="false"
    :action-row="{ showPreview: true, showSelect: false }"
    :ui="{
      calendar: 'calendarWidth',
      menu: 'noBorder',
    }"
    @range-start="onStartRange"
  />
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";

const model = defineModel();

function onStartRange(startDate) {
  model.value = [startDate, null];
}
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}

.calendarWidth {
  width: 400px;
  max-width: 100%;
}
.noBorder {
  border: none;
}
</style>
