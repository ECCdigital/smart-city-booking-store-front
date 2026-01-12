<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <div>
      <VueDatePicker
          v-model="model"
          time-picker
          format="HH:mm"
          cancel-text="Abbrechen"
          select-text="OK"
          teleport-center
          :disabled="props.disabled"
          :action-row="{ showPreview: false }"
          :ui="
        mode.value === 'dark'
          ? {
              input: 'darkBackground',
            }
          : {}
      "
          :dark="mode.value === 'dark'"
      />
    </div>
  </UTooltip>
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import {useContrastColor} from "~/composables/utils/useContrastColor.js";

const mode = useColorMode();
const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary(),
);

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
  color: v-bind(contrastToPrimary) !important;
}

.darkBackground {
  background-color: rgb(17, 24, 39);
}
</style>
