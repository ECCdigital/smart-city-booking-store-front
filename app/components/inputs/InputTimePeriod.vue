<template>
  <div class="flex justify-between w-full bg-white dark:bg-gray-700">
    <UModal
      v-model:open="isOpen"
      title="Zeitraum auswählen"
      :overlay="false"
      description="Wählen Sie den gewünschten Zeitraum aus."
      :ui="{
        content: 'bg-transparent divide-y-0 flex flex-col focus:outline-none',
      }"
    >
      <UButton
        size="lg"
        color="neutral"
        variant="ghost"
        icon="i-lucide-calendar-clock"
        class="w-full text-gray-400 dark:text-gray-200/60 font-normal rounded-lg bg-white dark:bg-gray-700 hover:bg-transparent py-2 px-3"
        :ui="{ leadingIcon: 'text-[16px] dark:text-gray-200 mr-1' }"
        @click="setDefaultStartDate()"
      >
        <template v-if="dateRange[0]">
          <div class="flex justify-between w-full">
            <div class="text-black dark:text-white">
              <span>{{ displayDate(dateRange[0]) }}</span>
              <span v-if="dateRange[1] && !timeRange.start"> - </span>
              <span v-if="timeRange.start">
                , {{ displayTime(timeRange.start) }} -
              </span>
              <span v-if="dateRange[1]"> {{ displayDate(dateRange[1]) }},</span>
              <span v-if="timeRange.end">
                {{ displayTime(timeRange.end) }}</span
              >
            </div>
          </div>
        </template>
        <template v-else> Zeitraum </template>
      </UButton>

      <template #content>
        <UCard variant="soft" class="w-90vw glass max-h-screen overflow-y-auto">
          <div class="flex justify-between items-center">
            <p class="text-lg font-bold my-5">Zeitraum auswählen</p>
            <div>
              <UTooltip text="Schließen">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-x"
                  class="rounded-xl"
                  @click="closeTimePeriodInput"
                />
              </UTooltip>
            </div>
          </div>

          <DatePicker v-model="dateRange" class="date-picker-container" />

          <div class="py-3 w-full">
            <p
              class="px-1"
              :class="missingValues.includes('startTime') ? 'text-red-500' : ''"
            >
              Startuhrzeit
            </p>
            <TimePicker
              v-model="timeRange.start"
              :text-input="{ format: 'HH:mm' }"
              @update:model-value="setDefaultEndTime"
            />
            <p
              v-if="missingValues.includes('startTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für den Beginn Ihrer Buchung an.)
            </p>
          </div>

          <div class="py-3 w-full">
            <p
              class="px-1"
              :class="missingValues.includes('endTime') ? 'text-red-500' : ''"
            >
              Enduhrzeit
            </p>
            <TimePicker
              v-model="timeRange.end"
              :text-input="{ format: 'HH:mm' }"
              :disabled="!timeRange.start"
              @update:model-value="removeValidation"
            />
            <p
              v-if="missingValues.includes('endTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für das Ende Ihrer Buchung an.)
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              label="OK"
              variant="ghost"
              class="dark:text-light text-dark"
              @click="onSelectDate"
            />
          </div>
        </UCard>
      </template>
    </UModal>

    <UButton
      v-if="hasAnyValue"
      color="neutral"
      variant="link"
      size="sm"
      icon="i-lucide-circle-x"
      aria-label="Clear input"
      class="mx-3"
      @click="onDeleteTimePeriod"
    />
  </div>
</template>

<script setup lang="ts">
import DatePicker from "./DatePicker.vue";
import TimePicker from "./TimePicker.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

/**
 * Public API:
 * - v-model:timePeriod -> { start: number | null, end: number | null } (timestamps in ms)
 */
type TimePeriod = {
  start: number | null;
  end: number | null;
};

type TimeHM = { hours: number; minutes: number } | null;

const props = defineProps<{
  modelValue?: TimePeriod; // alias falls du v-model ohne arg möchtest
  timePeriod?: TimePeriod; // unterstützt beide Varianten
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: TimePeriod): void;
  (e: "update:timePeriod", v: TimePeriod): void;
  (e: "selectDate", v: TimePeriod): void; // optional zusätzliches Event
  (e: "removeDate"): void;
}>();

// interne States
const dateRange = ref<Date[]>([]); // [startDate, endDate]
const timeRange = ref<{ start: TimeHM; end: TimeHM }>({
  start: null,
  end: null,
});
const isOpen = ref(false);
const missingValues = ref<string[]>([]);

// Hilfen
const coalesceModel = computed<TimePeriod>(() => {
  // bevorzugt v-model:timePeriod; fallback auf modelValue
  const v = props.timePeriod ?? props.modelValue ?? { start: null, end: null };
  return {
    start: typeof v.start === "number" ? v.start : null,
    end: typeof v.end === "number" ? v.end : null,
  };
});

const hasAnyValue = computed(
  () =>
    dateRange.value.length > 0 ||
    !!timeRange.value.start ||
    !!timeRange.value.end,
);

// Mapping eingehender Timestamps -> interne Picker-Modelle
function syncInFromModel(v: TimePeriod) {
  if (!v || (!v.start && !v.end)) {
    dateRange.value = [];
    timeRange.value = { start: null, end: null };
    return;
  }

  // Bestimme Startdate/Enddate und Time aus Timestamps
  const startDate = v.start ? new Date(v.start) : null;
  const endDate = v.end ? new Date(v.end) : null;

  // Date range
  const newRange: Date[] = [];
  if (startDate) newRange.push(new Date(startDate));
  if (endDate) newRange.push(new Date(endDate));
  dateRange.value = newRange;

  // Time range
  const startTime: TimeHM =
    startDate != null
      ? {
          hours: startDate.getHours(),
          minutes: startDate.getMinutes(),
        }
      : null;

  const endTime: TimeHM =
    endDate != null
      ? {
          hours: endDate.getHours(),
          minutes: endDate.getMinutes(),
        }
      : null;

  timeRange.value = { start: startTime, end: endTime };
}

// Mapping interner Picker-Modelle -> Timestamps
function buildTimestampsFromState(): TimePeriod {
  const [d0, d1] = dateRange.value;

  // Wenn nur Startdatum da ist und Endzeit gesetzt wurde, Enddatum = Startdatum
  const baseEndDate = d1 ?? d0 ?? null;

  const startTs =
    d0 && timeRange.value.start
      ? dateToTimestampWithTime(d0, timeRange.value.start)
      : null;

  const endTs =
    baseEndDate && timeRange.value.end
      ? dateToTimestampWithTime(baseEndDate, timeRange.value.end)
      : null;

  return { start: startTs, end: endTs };
}

function dateToTimestampWithTime(
  dateObj: Date,
  hm: { hours: number; minutes: number },
) {
  const d = new Date(dateObj);
  d.setHours(hm.hours, hm.minutes, 0, 0);
  return d.getTime();
}

// Initial + reactive Sync
watch(
  coalesceModel,
  (v) => {
    syncInFromModel(v);
  },
  { immediate: true, deep: true },
);

// Anzeige-Helper
function displayDate(date: Date | string | number | null) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("de-DE");
}
function displayTime(time: TimeHM) {
  if (!time) return "";
  const h = time.hours.toString().padStart(2, "0");
  const m = time.minutes.toString().padStart(2, "0");
  return `${h}:${m}`;
}

// UI Aktionen
function closeTimePeriodInput() {
  isOpen.value = false;
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
}

function setDefaultStartDate() {
  if (!dateRange.value[0]) {
    dateRange.value[0] = new Date();
  }
}

function setDefaultEndTime() {
  removeValidation();
  if (!timeRange.value.end && timeRange.value.start) {
    const initialTime = JSON.parse(JSON.stringify(timeRange.value.start));
    initialTime.hours = initialTime.hours + 1;
    timeRange.value.end = initialTime;
  }
}

function removeValidation() {
  if (timeRange.value.start) {
    missingValues.value = missingValues.value.filter((m) => m !== "startTime");
  }
  if (timeRange.value.end) {
    missingValues.value = missingValues.value.filter((m) => m !== "endTime");
  }
}

// OK-Button -> validieren + emittieren als Timestamps
function onSelectDate() {
  if (!timeRange.value.start || !timeRange.value.end) {
    if (!timeRange.value.start && !missingValues.value.includes("startTime")) {
      missingValues.value.push("startTime");
    }
    if (!timeRange.value.end && !missingValues.value.includes("endTime")) {
      missingValues.value.push("endTime");
    }
    return;
  }

  const result = buildTimestampsFromState();

  isOpen.value = false;

  emit("update:timePeriod", result);
  emit("update:modelValue", result);

  // optional: original "selectDate" beibehalten
  emit("selectDate", result);
}

// Clear
function onDeleteTimePeriod() {
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
  missingValues.value = [];

  const cleared: TimePeriod = { start: null, end: null };
  emit("update:timePeriod", cleared);
  emit("update:modelValue", cleared);
  emit("removeDate");
}
</script>

<style scoped></style>
