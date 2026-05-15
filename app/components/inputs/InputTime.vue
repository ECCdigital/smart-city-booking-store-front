<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <div>
      <div
        class="flex items-center bg-default border border-1.5 rounded-md px-1 border-primary"
        :class="{ 'flex-wrap gap-1': props.showDate }"
      >
        <template v-if="props.showDate">
          <UTooltip text="Datum auswählen">
            <UIcon
              name="i-lucide-calendar"
              class="text-gray-400 mx-0.5 shrink-0"
            />
          </UTooltip>
          <UInputDate
            v-model="calendarDate"
            variant="ghost"
            :disabled="props.disabled"
            :min-value="minCalendarDate"
            class="shrink-0"
          />
        </template>

        <UTooltip text="Uhrzeit auswählen">
          <UIcon
            name="i-lucide-clock"
            class="text-gray-400 mx-0.5 cursor-pointer shrink-0"
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
<script setup lang="ts">
import {
  Time,
  fromDate,
  getLocalTimeZone,
  today,
  toCalendarDate,
} from "@internationalized/date";
import TimePickerDialog from "~/components/inputs/TimePickerDialog.vue";

const model = defineModel();
const dateModel = defineModel("date", { default: null });

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  enableTimePicker: {
    type: Boolean,
    default: true,
  },
  showDate: {
    type: Boolean,
    default: false,
  },
});

const openTimePickerDialog = ref(false);
const minCalendarDate = today(getLocalTimeZone());

function jsDateToCalendarDate(value: unknown) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return null;
  return toCalendarDate(fromDate(d, getLocalTimeZone()));
}

const calendarDate = computed({
  get() {
    return jsDateToCalendarDate(dateModel.value);
  },
  set(val) {
    if (!val) {
      dateModel.value = null;
      return;
    }
    const result = val.toDate(getLocalTimeZone());
    result.setFullYear(val.year, val.month - 1, val.day);
    result.setHours(0, 0, 0, 0);
    dateModel.value = result;
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

function setTime({ hours, minutes }) {
  model.value = { hours, minutes };
}
</script>

<style>
.click-area {
  width: 100%;
  background: transparent;
}
</style>
