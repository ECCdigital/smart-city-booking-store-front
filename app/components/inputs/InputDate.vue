<template>
  <div
    class="flex items-center bg-default border border-1.5 rounded-md px-1 border-accented focus-within:ring-1 focus-within:border-primary focus-within:ring-primary gap-1"
    :class="{ 'opacity-60': props.disabled }"
    @focusout="onFieldFocusOut"
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
      ref="dateFieldRef"
      v-model="internalCalendarDate"
      variant="ghost"
      :disabled="props.disabled"
      :min-value="minCalendarDate"
      :max-value="maxCalendarDate"
      class="flex-1 min-w-0"
      @focus="onDateFieldFocus"
      @blur="commitCalendarDate"
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
import { getLocalTimeZone, today } from "@internationalized/date";
import DatePicker from "~/components/inputs/DatePicker.vue";
import { jsDateToCalendarDate } from "~/utils/localDate.js";
import { useCalendarDateField } from "~/composables/useCalendarDateField.js";

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
const dateFieldRef = ref<{ $el?: HTMLElement } | null>(null);

function getFieldRoot() {
  const el = dateFieldRef.value?.$el;
  return el instanceof HTMLElement ? el : null;
}

const {
  internalCalendarDate,
  onDateFieldFocus,
  commitCalendarDate,
  onFieldFocusOut,
  setCalendarDateFromPicker,
  clearCalendarDate,
} = useCalendarDateField(model, { getFieldRoot });

const minCalendarDate = computed(() => {
  if (props.minDate) return jsDateToCalendarDate(props.minDate);
  if (props.disablePast) return today(getLocalTimeZone());
  return undefined;
});

const maxCalendarDate = computed(() =>
  props.maxDate ? jsDateToCalendarDate(props.maxDate) : undefined
);

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
    setCalendarDateFromPicker(pendingDate.value);
  } else {
    clearCalendarDate();
  }
  closeDatePicker();
}

function clearDate() {
  pendingDate.value = null;
  clearCalendarDate();
}
</script>
