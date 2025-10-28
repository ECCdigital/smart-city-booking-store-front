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
    :ui="mode==='dark' ? {
      calendar: 'calendarWidth noBorder darkBackground',
      menu: 'noBorder darkBackground',
    } : {
      calendar: 'calendarWidth',
      menu: 'noBorder',
    }"
    :dark=" mode==='dark' "
    @range-start="onStartRange"
  />
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import { useColorMode } from '@vueuse/core'

const model = defineModel();
const mode = useColorMode()

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

.darkBackground {
  background-color: rgb(17, 24, 39);
}
</style>
