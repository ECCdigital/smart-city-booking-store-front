<template>
  <div class="flex flex-col gap-1">
    <div class="flex gap-1">
      <div class="w-48 md:w-36 shrink-0">
        <PeriodField
          v-model="dateModel"
          version="date"
          :disabled="disabled"
          :class="
            missingValues.includes('date') || isInvalidDate
              ? 'border-2 border-red-500'
              : ''
          "
        >
          <input
            :value="dateInput"
            type="date"
            class="inputFieldClass"
            :disabled="disabled"
            @change="onDateInputChange"
          />
        </PeriodField>
      </div>

      <div v-if="!disableTime" class="w-28 md:w-26 shrink-0">
        <PeriodField
          v-model="timeModel"
          version="time"
          :disabled="disabled"
          :class="
            missingValues.includes('time') || isInvalidTime
              ? 'border-2 border-red-500'
              : ''
          "
        >
          <input
            :value="timeInput"
            type="time"
            class="inputFieldClass"
            :disabled="disabled"
            @change="onTimeInputChange"
          />
        </PeriodField>
      </div>
    </div>
    <slot name="buttons" />
  </div>
</template>
<script setup lang="ts">
import { useCalendarDateField } from "~/composables/useCalendarDateField.js";
import { readTimeFromTimeFieldRoot } from "~/utils/localDate.js";
import PeriodField from "~/components/inputs/PeriodField.vue";

const dateModel = defineModel("date", { type: Date, default: null });
const timeModel = defineModel("time", {
  type: Object,
  default: { hours: null, minutes: null },
});

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  showDate: {
    type: Boolean,
    default: false,
  },
  missingValues: {
    type: Array,
    default: () => [],
  },
  isInvalidDate: {
    type: Boolean,
    default: false,
  },
  isInvalidTime: {
    type: Boolean,
    default: false,
  },
  disableTime: {
    type: Boolean,
    default: false,
  },
});

const dateInput = computed(() =>
  dateModel.value ? formatLocalDateIso(dateModel.value) : "",
);
function onDateInputChange(event: Event) {
  const v = event.target?.value;
  if (!v) {
    dateModel.value = null;
    return;
  }
  const parsed = new Date(v);
  if (!parsed || parsed.getFullYear() < 1000) return;
  dateModel.value = parsed;
}

const timeInput = computed(() => {
  if (
    !timeModel.value ||
    timeModel.value.hours == null ||
    timeModel.value.minutes == null
  ) {
    return "";
  }
  const hh = String(timeModel.value.hours).padStart(2, "0");
  const mm = String(timeModel.value.minutes).padStart(2, "0");
  return `${hh}:${mm}`;
});
function isCompleteTime(t) {
  return (
    t != null &&
    Number.isInteger(t.hours) &&
    Number.isInteger(t.minutes) &&
    t.hours >= 0 &&
    t.hours <= 23 &&
    t.minutes >= 0 &&
    t.minutes <= 59
  );
}
function onTimeInputChange(event: Event) {
  const v = event.target.value; // "HH:mm" oder ""
  if (!v) {
    timeModel.value = null;
    return;
  }
  // nur vollständige HH:mm (verhindert 15:1 → 15:01)
  if (!/^\d{2}:\d{2}$/.test(v)) return;
  const [h, m] = v.split(":").map(Number);
  timeModel.value = { hours: h, minutes: m };
}
</script>

<style>
.click-area {
  position: absolute;
  inset: 0;
  background: transparent;
}

input::-webkit-calendar-picker-indicator {
  display: none;
}

input[type="date"]::-webkit-input-placeholder {
  visibility: hidden !important;
}

.inputFieldClass {
  width: 100%;
  min-width: 0;
  margin: 0.25rem;
  padding: 0.25rem;

  background-color: #fff;
  color: #111827;
  font-size: 0.875rem;
  border-radius: 0.375rem;

  cursor: text;
  text-align: center;

  transition:
    background-color 150ms,
    border-color 150ms;
}

.inputFieldClass:hover {
  background-color: #f9fafb;
  border-color: #d1d5db;
}

.inputFieldClass:focus {
  outline: none;
  box-shadow: none;
}

.inputFieldClass:disabled {
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
