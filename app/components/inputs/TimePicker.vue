<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <VueDatePicker
      v-model="model"
      time-picker
      format="HH:mm"
      cancel-text="Abbrechen"
      select-text="OK"
      teleport-center
      :disabled="disabled"
      :action-row="{ showPreview: false }"
      :ui="
        mode === 'dark'
          ? {
              input: 'darkBackground',
            }
          : {}
      "
      :dark="mode === 'dark'"
    />
  </UTooltip>
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import { useColorMode } from "@vueuse/core";

const mode = useColorMode();

const model = defineModel();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}

.darkBackground {
  background-color: rgb(17, 24, 39);
}
</style>
