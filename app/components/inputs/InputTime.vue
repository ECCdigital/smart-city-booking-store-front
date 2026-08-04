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
            v-model="dateInput"
            type="date"
            class="inputFieldClass"
            :disabled="disabled"
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
            v-model="timeInput"
            type="time"
            class="inputFieldClass"
            :disabled="disabled"
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

const dateInput = computed({
  get() {
    if (!dateModel.value) return null;
    return dateModel.value.toISOString().split("T")[0];
  },
  set(v: string | null) {
    if (!v) {
      dateModel.value = null;
      return;
    }
    dateModel.value = new Date(v);
  },
});
const timeInput = computed({
  get() {
    if (
      !timeModel.value ||
      timeModel.value.hours === null ||
      timeModel.value.minutes === null
    ) {
      return "";
    }

    const hh = timeModel.value.hours.toString().padStart(2, "0");
    const mm = timeModel.value.minutes.toString().padStart(2, "0");

    return `${hh}:${mm}`;
  },
  set(v: string | null) {
    if (!v) {
      timeModel.value = null;
      return;
    }

    const parts = v.split(":");

    timeModel.value = {
      hours: Number(parts[0]),
      minutes: Number(parts[1]),
    };
  },
});

const openTimePickerDialog = ref(false);
const openDatePickerDialog = ref(false);
const pendingDate = ref<Date | null>(null);
const dateFieldRef = ref<{ $el?: HTMLElement } | null>(null);
const timeFieldRef = ref<{ $el?: HTMLElement } | null>(null);

function getFieldRoot() {
  const el = dateFieldRef.value?.$el;
  return el instanceof HTMLElement ? el : null;
}

const {
  internalCalendarDate,
  onDateFieldFocus,
  commitCalendarDate,
  setCalendarDateFromPicker,
} = useCalendarDateField(dateModel, { getFieldRoot });

function syncTimeFromDom() {
  const el = timeFieldRef.value?.$el;
  const root = el instanceof HTMLElement ? el : null;
  const parsed = readTimeFromTimeFieldRoot(root);
  if (parsed) {
    model.value = parsed;
  }
}

function handleFieldFocusOut(event) {
  if (event.currentTarget.contains(event.relatedTarget)) return;
  commitCalendarDate();
  syncTimeFromDom();
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
