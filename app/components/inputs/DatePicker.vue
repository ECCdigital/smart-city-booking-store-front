<template>
  <VueDatePicker
    v-model="model"
    format="dd.MM.yyyy HH:mm"
    :min-date="now"
    locale="de"
    month-name-format="long"
    cancelText="Abbrechen"
    selectText="OK"
    teleport-center
  />
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";

const model = defineModel();
const now = ref(Date.now());
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}
</style>
