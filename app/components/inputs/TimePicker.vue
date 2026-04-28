<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <div>
      <div class="hidden lg:block">
        <UInputTime
            v-model="time"
            icon="i-lucide-clock"
            :hour-cycle="24"
            variant="outline"
            :disabled="props.disabled"
        />
      </div>
      <VueDatePicker
        v-model="model"
        time-picker
        format="HH:mm"
        :text-input="{ maskFormat: 'hh:mm' }"
        cancel-text="Abbrechen"
        select-text="OK"
        teleport-center
        :disabled="props.disabled"
        :action-row="{ showPreview: false }"
        :ui="{
          input: '!bg-transparent !text-black dark:!text-white',
          menu: '!bg-white dark:!bg-gray-900',
          calendar: '!bg-transparent',
        }"
        :dark="isDark"
        class="block lg:hidden"
      />
    </div>
  </UTooltip>
</template>
<script setup>
import VueDatePicker from "@vuepic/vue-datepicker";
import { Time } from "@internationalized/date";

const model = defineModel();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
});

const time = computed({
  get() {
    const val = model.value;
    if (!val) return null;

    return new Time(val.hours, val.minutes);
  },
  set(val) {
    if (!val) {
      model.value = null;
      return;
    }

    model.value = {
      hours: val.hour,
      minutes: val.minute,
    };
  },
});

const mode = useColorMode();
const isDark = computed(() => mode.value === "dark");
</script>

<style>
.dp__action_buttons .dp__action_select {
  background-color: var(--color-primary) !important;
}

.dp__theme_light {
  --dp-background-color: transparent;
}

.dp__theme_dark {
  --dp-background-color: transparent;
}

.dp__action_cancel {
  border: none;
}

.darkBackground {
  background-color: rgb(17, 24, 39);
}
</style>
