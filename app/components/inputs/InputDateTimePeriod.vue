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
        :size="compact ? 'sm' : 'lg'"
        color="neutral"
        variant="ghost"
        icon="i-lucide-calendar-clock"
        :class="[
          'w-full text-gray-400 dark:text-gray-200/60 font-normal rounded-md bg-white dark:bg-gray-700 hover:bg-transparent',
          compact ? 'py-1 px-2 text-sm' : 'py-2 px-3',
        ]"
        :ui="{ leadingIcon: compact ? 'text-[13px] dark:text-gray-200 mr-1' : 'text-[16px] dark:text-gray-200 mr-1' }"
      >
        <template v-if="dateRange[0]">
          <div class="flex justify-between w-full">
            <div class="text-black dark:text-white">
              {{ formatDateTimeRange(dateRange, timeRange) }}
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
          <p
              v-if="missingValues.includes('date')"
              class="text-red-500 text-sm"
          >
            (Bitte wählen Sie einen Tag aus, an dem Sie buchen möchten.)
          </p>

          <div class="py-3 w-full">
            <div class="flex items-center space-x-2 mb-2">
              <p
                class="px-1 font-semibold"
                :class="
                  missingValues.includes('startTime') ? 'text-red-500' : ''
                "
              >
                Startuhrzeit
              </p>
              <UButton
                  label="Jetzt"
                  color="neutral"
                  variant="soft"
                  @click="
                  () =>
                    (timeRange.start = {
                      hours: new Date().getHours(),
                      minutes: new Date().getMinutes(),
                    })
                "
              />
            </div>
            <div class="flex items-center space-x-2">
              <InputTime
                v-model="timeRange.start"
                v-model:date="startInputDate"
                show-date
                class="w-full"
                @update:model-value="setDefaultEndTime"
              />
            </div>

            <p
              v-if="missingValues.includes('startTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für den Beginn Ihrer Buchung an.)
            </p>
          </div>

          <div class="py-3 w-full">
            <div class="flex items-center space-x-2 mb-2">
              <p
                class="px-1 font-semibold"
                :class="missingValues.includes('endTime') ? 'text-red-500' : ''"
              >
                Enduhrzeit
              </p>

              <UButton
                  label="0:30h"
                  color="neutral"
                  variant="soft"
                  :disabled="!timeRange.start"
                  @click="addToStartTime(30)"
              />
              <UButton
                  label="1:00h"
                  color="neutral"
                  variant="soft"
                  :disabled="!timeRange.start"
                  @click="addToStartTime(60)"
              />
              <UButton
                  label="2:00h"
                  color="neutral"
                  variant="soft"
                  :disabled="!timeRange.start"
                  @click="addToStartTime(120)"
              />
              <UButton
                  label="4:00h"
                  color="neutral"
                  variant="soft"
                  :disabled="!timeRange.start"
                  @click="addToStartTime(240)"
              />
            </div>

            <div class="flex items-center space-x-2">

              <InputTime
                v-model="timeRange.end"
                v-model:date="endInputDate"
                show-date
                :disabled="!timeRange.start"
                class="w-full"
                @update:model-value="onEndTimeManualChange"
              />
            </div>
            <p
              v-if="missingValues.includes('endTime')"
              class="text-red-500 text-sm"
            >
              (Bitte geben Sie eine Uhrzeit für das Ende Ihrer Buchung an.)
            </p>
            <p
              v-if="invalidTimeslot"
              class="text-red-500 text-sm"
            >
              (Die Endzeit muss nach der Startzeit liegen.)
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

    <ClearButton :show-clear-button="hasAnyValue" @clear="onDeleteTimePeriod" />
  </div>
</template>

<script setup lang="ts">
import DatePicker from "./DatePicker.vue";
import InputTime from "./InputTime.vue";
import ClearButton from "~/components/inputs/ClearButton.vue";

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
  compact?: boolean;
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
const endTimeAutoSet = ref(false);
const isUpdatingEndAutomatically = ref(false);
const invalidTimeslot = computed(() => {
  if ((dateRange.value.length === 2 && dateRange.value[1] !== null ) || !timeRange.value.start || !timeRange.value.end) return false;

  const startTotalMinutes =
    timeRange.value.start.hours * 60 + timeRange.value.start.minutes;
  const endTotalMinutes =
    timeRange.value.end.hours * 60 + timeRange.value.end.minutes;

  return endTotalMinutes <= startTotalMinutes;
});

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

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return null;
  const result = new Date(d);
  result.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
  result.setHours(0, 0, 0, 0);
  return result;
}

const startInputDate = computed({
  get: () => normalizeDate(dateRange.value[0]),
  set: (d: Date | null) => {
    const normalized = normalizeDate(d);
    if (!normalized) return;
    const next = [...dateRange.value];
    next[0] = normalized;
    dateRange.value = next;
    removeValidation();
  },
});

const endInputDate = computed({
  get: () => normalizeDate(dateRange.value[1] ?? dateRange.value[0]),
  set: (d: Date | null) => {
    const normalized = normalizeDate(d);
    if (!normalized) return;
    const next = [...dateRange.value];
    if (!next[0]) next[0] = normalized;
    next[1] = normalized;
    dateRange.value = next;
    removeValidation();
  },
});

// Mapping eingehender Timestamps -> interne Picker-Modelle
function syncInFromModel(v: TimePeriod) {
  if (!v || (!v.start && !v.end)) {
    dateRange.value = [];
    timeRange.value = { start: null, end: null };
    endTimeAutoSet.value = false;
    return;
  }

  endTimeAutoSet.value = false;

  // Bestimme Startdate/Enddate und Time aus Timestamps
  const startDate = v.start ? new Date(v.start) : null;
  const endDate = v.end ? new Date(v.end) : null;

  // Date range
  const newRange: Date[] = [];
  const normalizedStart = normalizeDate(startDate);
  const normalizedEnd = normalizeDate(endDate);
  if (normalizedStart) newRange.push(normalizedStart);
  if (normalizedEnd) newRange.push(normalizedEnd);
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
function formatDate(dateStr: string | number | Date) {
  if (!dateStr) {
    return "";
  }
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatTime(timeObj: object) {
  if (!timeObj) {
    return "";
  }
  const hours = String(timeObj.hours).padStart(2, "0");
  const minutes = String(timeObj.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTimeRange(
  dates: string[] | number[] | Date[],
  timeRange: object,
) {
  if (!dates || dates.length !== 2) return "";

  const [start, end] = dates;

  const d1 = new Date(start);
  const d2 = new Date(end);

  const sameDay =
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  const startDate = formatDate(start);
  const endDate = formatDate(end);

  const startTime = formatTime(timeRange.start);
  const endTime = formatTime(timeRange.end);

  if (sameDay) {
    // dd.mm.yyyy hh:mm - hh:mm
    return `${startDate} ${startTime} - ${endTime}`;
  }

  // dd.mm.yyyy hh:mm - dd.mm.yyyy hh:mm
  return `${startDate} ${startTime} - ${endDate} ${endTime}`;
}

// UI Aktionen
function closeTimePeriodInput() {
  isOpen.value = false;
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
  endTimeAutoSet.value = false;
}

type TimeParts = { hours: number; minutes: number };

function addToTime(time: TimeParts, addedMinutes: number): TimeParts {
  const totalMinutes = time.hours * 60 + time.minutes + addedMinutes;
  return {
    hours: Math.floor(totalMinutes / 60) % 24,
    minutes: totalMinutes % 60,
  };
}

function applyEndFromStartPlusMinutes(
  addedMinutes: number,
  { autoSet = false }: { autoSet?: boolean } = {},
) {
  removeValidation();
  const startTime = timeRange.value.start;
  if (!startTime) return;

  const startDate = normalizeDate(dateRange.value[0]);

  if (!startDate) {
    timeRange.value.end = addToTime(startTime, addedMinutes);
    if (!autoSet) endTimeAutoSet.value = false;
    return;
  }

  const endDateTime = new Date(startDate);
  endDateTime.setHours(startTime.hours, startTime.minutes, 0, 0);
  endDateTime.setMinutes(endDateTime.getMinutes() + addedMinutes);

  const next = [...dateRange.value];
  if (!next[0]) next[0] = startDate;
  next[1] = normalizeDate(endDateTime)!;
  dateRange.value = next;

  if (autoSet) {
    isUpdatingEndAutomatically.value = true;
    endTimeAutoSet.value = true;
  } else {
    endTimeAutoSet.value = false;
  }

  timeRange.value.end = {
    hours: endDateTime.getHours(),
    minutes: endDateTime.getMinutes(),
  };

  if (autoSet) {
    nextTick(() => {
      isUpdatingEndAutomatically.value = false;
    });
  }
}

function setDefaultEndTime() {
  if (!timeRange.value.start) return;

  if (!timeRange.value.end || endTimeAutoSet.value) {
    applyEndFromStartPlusMinutes(60, { autoSet: true });
  } else {
    removeValidation();
  }
}

function onEndTimeManualChange() {
  removeValidation();
  if (isUpdatingEndAutomatically.value) return;
  endTimeAutoSet.value = false;
}

function addToStartTime(addedMinutes: number) {
  applyEndFromStartPlusMinutes(addedMinutes);
}

function removeValidation() {
  if (dateRange.value.length >0) {
    missingValues.value = missingValues.value.filter((m) => m !== "date");
  }
  if (timeRange.value.start) {
    missingValues.value = missingValues.value.filter((m) => m !== "startTime");
  }
  if (timeRange.value.end) {
    missingValues.value = missingValues.value.filter((m) => m !== "endTime");
  }
}

// OK-Button -> validieren + emittieren als Timestamps
function onSelectDate() {
  removeValidation()
  if(dateRange.value.length === 0) {
    if (!missingValues.value.includes("date")) {
      missingValues.value.push("date");
    }
    return;
  }
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
  endTimeAutoSet.value = false;

  const cleared: TimePeriod = { start: null, end: null };
  emit("update:timePeriod", cleared);
  emit("update:modelValue", cleared);
  emit("removeDate");
}
</script>

<style scoped></style>
