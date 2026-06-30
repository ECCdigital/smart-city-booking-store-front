<template>
  <UTooltip text="Wählen Sie erst ein Startdatum." :disabled="!disabled">
    <TimePickerDialog
      v-model:open="openTimePickerDialog"
      :time="model"
      @update-time="setTime"
    >
      <div
        class="flex items-center bg-default border rounded-md px-1 border-accented focus-within:ring-1 focus-within:border-primary focus-within:ring-primary"
        :class="{ 'flex-wrap gap-1': props.showDate }"
        @focusout="handleFieldFocusOut"
      >
        <template v-if="props.showDate">
          <UTooltip text="Datum auswählen">
            <UIcon
              name="i-lucide-calendar"
              class="text-gray-400 mx-0.5 shrink-0 cursor-pointer"
              :class="{ 'pointer-events-none opacity-50': props.disabled }"
              @click="openDatePicker"
            />
          </UTooltip>
          <UInputDate
            ref="dateFieldRef"
            v-model="internalCalendarDate"
            variant="ghost"
            :disabled="props.disabled"
            :min-value="minCalendarDate"
            class="shrink-0 px-1"
            @focus="onDateFieldFocus"
            @blur="commitCalendarDate"
          />
        </template>

        <div class="relative flex items-center flex-1 min-w-0">
          <UTooltip text="Uhrzeit auswählen">
            <UIcon
              name="i-lucide-clock"
              class="text-gray-400 mx-0.5 cursor-pointer shrink-0"
              :class="{ 'pointer-events-none opacity-50': props.disabled }"
              @click="openPicker"
            />
          </UTooltip>
          <UInputTime
            ref="timeFieldRef"
            v-model="time"
            :hour-cycle="24"
            variant="ghost"
            :disabled="props.disabled"
            class="px-1"
            @focus="commitCalendarDate"
          />
          <div
            class="click-area cursor-pointer"
            :class="{ 'pointer-events-none': props.disabled }"
            @click="openPicker"
          />
        </div>
      </div>
    </TimePickerDialog>
  </UTooltip>

  <UModal
    v-if="props.showDate"
    v-model:open="openDatePickerDialog"
    title="Datum auswählen"
    :overlay="false"
    description="Wählen Sie das gewünschte Datum aus."
    :ui="{
      content: 'bg-transparent divide-y-0 flex flex-col focus:outline-none',
    }"
  >
    <template #content>
      <UCard variant="soft" class="w-90vw glass max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center">
          <p class="text-lg font-bold my-5">Datum auswählen</p>
          <UTooltip text="Schließen">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              class="rounded-xl"
              @click="closeDatePicker"
            />
          </UTooltip>
        </div>

        <DatePicker v-model="pendingDate" :range="false" />

        <div class="flex justify-end mt-3">
          <UButton
            label="OK"
            variant="ghost"
            class="dark:text-light text-dark"
            @click="confirmDateSelection"
          />
        </div>
      </UCard>
    </template>
  </UModal>
</template>
<script setup lang="ts">
import { Time, getLocalTimeZone, today } from "@internationalized/date";
import DatePicker from "~/components/inputs/DatePicker.vue";
import TimePickerDialog from "~/components/inputs/TimePickerDialog.vue";
import { useCalendarDateField } from "~/composables/useCalendarDateField.js";
import { readTimeFromTimeFieldRoot } from "~/utils/localDate.js";

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
const openDatePickerDialog = ref(false);
const pendingDate = ref<Date | null>(null);
const minCalendarDate = today(getLocalTimeZone());
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

function openPicker() {
  if (props.disabled) return;
  commitCalendarDate();
  syncTimeFromDom();
  openTimePickerDialog.value = true;
}

function openDatePicker() {
  if (props.disabled) return;
  pendingDate.value = dateModel.value ? new Date(dateModel.value) : null;
  openDatePickerDialog.value = true;
}

function closeDatePicker() {
  openDatePickerDialog.value = false;
}

function confirmDateSelection() {
  if (pendingDate.value) {
    setCalendarDateFromPicker(pendingDate.value);
  }
  closeDatePicker();
}

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
  position: absolute;
  inset: 0;
  background: transparent;
}
</style>
