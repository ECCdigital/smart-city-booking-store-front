<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <div>
      <div
        class="flex items-center bg-default border border-1.5 rounded-md px-1 border-primary"
      >
        <UTooltip text="Uhrzeit auswählen">
          <UIcon
            name="i-lucide-clock"
            class="text-gray-400 mx-0.5 cursor-pointer"
            @click="() => (openTimePickerDialog = true)"
          />
        </UTooltip>
        <UInputTime
          v-model="time"
          :hour-cycle="24"
          variant="ghost"
          :disabled="props.disabled"
        />
        <div
          class="click-area cursor-pointer"
          @click="() => (openTimePickerDialog = true)"
        />
      </div>

      <TimePickerDialog
        :open-dialog="openTimePickerDialog"
        :time="model"
        @update-time="setTime"
        @close-dialog="() => (openTimePickerDialog = false)"
      />
    </div>
  </UTooltip>
</template>
<script setup>
import { Time } from "@internationalized/date";
import TimePickerDialog from "~/components/inputs/TimePickerDialog.vue";

const model = defineModel();
const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  enableTimePicker: {
    type: Boolean,
    default: true,
  },
});

const openTimePickerDialog = ref(false);
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

function setTime({ hours, minutes }) {
  model.value = { hours, minutes };
}
</script>

<style>
.click-area {
  width: 100%;
  min-height: 20px;
  background: transparent;
}
</style>
