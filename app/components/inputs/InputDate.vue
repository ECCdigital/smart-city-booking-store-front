<template>
  <div
    class="flex items-center bg-default border border-1.5 rounded-md px-1 border-accented focus-within:ring-1 focus-within:border-primary focus-within:ring-primary gap-1"
    :class="{ 'opacity-60': props.disabled }"
  >
    <UTooltip :text="$t('inputDate.openPicker')">
      <UIcon
        name="i-lucide-calendar"
        class="text-gray-400 mx-0.5 shrink-0 cursor-pointer"
        :class="{ 'pointer-events-none opacity-50': props.disabled }"
        @click="openDatePicker"
      />
    </UTooltip>

    <UInputDate
      v-model="calendarDate"
      variant="ghost"
      :disabled="props.disabled"
      :min-value="minCalendarDate"
      :max-value="maxCalendarDate"
      class="flex-1 min-w-0"
    />

    <UButton
      v-if="clearable && model && !props.disabled"
      color="neutral"
      variant="ghost"
      icon="i-lucide-x"
      size="xs"
      :aria-label="$t('inputDate.clear')"
      @click.stop="clearDate"
    />
  </div>

  <UModal
    v-model:open="openDatePickerDialog"
    :title="dialogTitle || $t('inputDate.dialogTitle')"
    :overlay="false"
    :description="dialogDescription || $t('inputDate.dialogDescription')"
    :ui="{
      content: 'bg-transparent divide-y-0 flex flex-col focus:outline-none',
    }"
  >
    <template #content>
      <UCard variant="soft" class="w-90vw glass max-h-screen overflow-y-auto">
        <div class="flex justify-between items-center">
          <p class="text-lg font-bold my-5">
            {{ dialogTitle || $t("inputDate.dialogTitle") }}
          </p>
          <UTooltip :text="$t('common.cancel')">
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
import {
  fromDate,
  getLocalTimeZone,
  today,
  toCalendarDate,
} from "@internationalized/date";
import DatePicker from "~/components/inputs/DatePicker.vue";

const model = defineModel<Date | null>({ default: null });

const props = defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  clearable: {
    type: Boolean,
    default: true,
  },
  minDate: {
    type: [Date, String, Number, null],
    default: () => null,
  },
  maxDate: {
    type: [Date, String, Number, null],
    default: () => null,
  },
  /** If true, the min date is set to today (overrides minDate when minDate is null). */
  disablePast: {
    type: Boolean,
    default: false,
  },
  dialogTitle: {
    type: String,
    default: null,
  },
  dialogDescription: {
    type: String,
    default: null,
  },
});

const openDatePickerDialog = ref(false);
const pendingDate = ref<Date | null>(null);

function jsDateToCalendarDate(value: unknown) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return null;
  return toCalendarDate(fromDate(d, getLocalTimeZone()));
}

const minCalendarDate = computed(() => {
  if (props.minDate) return jsDateToCalendarDate(props.minDate);
  if (props.disablePast) return today(getLocalTimeZone());
  return undefined;
});

const maxCalendarDate = computed(() =>
  props.maxDate ? jsDateToCalendarDate(props.maxDate) : undefined
);

const calendarDate = computed({
  get() {
    return jsDateToCalendarDate(model.value);
  },
  set(val) {
    if (!val) {
      model.value = null;
      return;
    }
    const result = val.toDate(getLocalTimeZone());
    result.setFullYear(val.year, val.month - 1, val.day);
    result.setHours(0, 0, 0, 0);
    model.value = result;
  },
});

function openDatePicker() {
  if (props.disabled) return;
  pendingDate.value = model.value ? new Date(model.value) : null;
  openDatePickerDialog.value = true;
}

function closeDatePicker() {
  openDatePickerDialog.value = false;
}

function confirmDateSelection() {
  if (pendingDate.value) {
    const d = new Date(pendingDate.value);
    d.setHours(0, 0, 0, 0);
    model.value = d;
  } else {
    model.value = null;
  }
  closeDatePicker();
}

function clearDate() {
  pendingDate.value = null;
  model.value = null;
}
</script>
