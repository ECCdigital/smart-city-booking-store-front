<template>
  <div class="flex justify-between w-full bg-white dark:bg-gray-700">
    <UButton
      :size="compact ? 'sm' : 'lg'"
      color="neutral"
      variant="ghost"
      icon="i-lucide-calendar-clock"
      :class="[
        'w-full text-gray-400 dark:text-gray-200/60 font-normal rounded-md bg-white dark:bg-gray-700 hover:bg-transparent',
        compact ? 'py-1 px-2 text-sm' : 'py-2 px-3',
        isOpen ? 'ring-1 ring-primary/40' : '',
      ]"
      :ui="{
        leadingIcon: compact
          ? 'text-[13px] dark:text-gray-200 mr-1'
          : 'text-[16px] dark:text-gray-200 mr-1',
      }"
      @click="toggleOpen"
    >
      <template v-if="hasConfirmedDisplay">
        <div class="flex justify-between w-full">
          <div class="text-black dark:text-white">
            {{ formatDateTimeRange(dateRange, timeRange) }}
          </div>
        </div>
      </template>
      <template v-else> Zeitraum </template>
    </UButton>

    <ClearButton :show-clear-button="hasAnyValue" @clear="onDeleteTimePeriod" />

    <!-- Desktop / large: strip below SearchBar -->
    <Teleport v-if="variant === 'bar' && panelHostEl" :to="panelHostEl">
      <div
        v-if="isOpen"
        class="glass rounded-b-lg shadow-lg border border-default bg-white dark:bg-gray-700 px-2.5 py-2 z-50"
      >
        <div class="flex justify-between gap-x-2 gap-y-1.5">
          <div class="flex justify-center w-full gap-x-2">
            <div
              class="text-xs font-semibold text-muted shrink-0 w-12 h-10 flex items-center"
            >
              Beginn
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex gap-1">
                <div class="w-36 shrink-0">
                  <PeriodField
                    v-model="startDate"
                    version="date"
                    :class="
                      missingValues.includes('date') || invalidDateSlot
                        ? 'border-2 border-red-500'
                        : ''
                    "
                  >
                    <input
                      v-model="startDateInput"
                      type="date"
                      class="inputFieldClass"
                    />
                  </PeriodField>
                </div>

                <div class="w-26 shrink-0">
                  <PeriodField
                    v-model="startTime"
                    version="time"
                    :class="
                      missingValues.includes('startTime') || invalidTimeslot
                        ? 'border-2 border-red-500'
                        : ''
                    "
                  >
                    <input
                      v-model="startTimeInput"
                      type="time"
                      class="inputFieldClass"
                    />
                  </PeriodField>
                </div>
              </div>
              <div>
                <UButton
                  label="Jetzt"
                  color="primary"
                  variant="soft"
                  size="xs"
                  @click="setPeriodToNow"
                />
              </div>
            </div>

            <span class="text-muted select-none px-0.5 h-10 flex items-center"
              >→</span
            >

            <div
              class="text-xs font-semibold text-muted shrink-0 w-8 h-10 flex items-center"
            >
              Ende
            </div>
            <div class="flex flex-col gap-1">
              <div class="flex gap-1">
                <div class="w-36 shrink-0">
                  <PeriodField
                    v-model="endDate"
                    version="date"
                    :class="invalidDateSlot ? 'border-2 border-red-500' : ''"
                  >
                    <input
                      v-model="endDateInput"
                      type="date"
                      class="inputFieldClass"
                    />
                  </PeriodField>
                </div>

                <div class="w-26 shrink-0">
                  <PeriodField
                    v-model="endTime"
                    version="time"
                    :class="
                      missingValues.includes('endTime') || invalidTimeslot
                        ? 'border-2 border-red-500'
                        : ''
                    "
                  >
                    <input
                      v-model="endTimeInput"
                      type="time"
                      class="inputFieldClass"
                    />
                  </PeriodField>
                </div>
              </div>
              <div class="flex gap-1">
                <UButton
                  v-for="mins in durationPresets"
                  :key="mins"
                  :label="'+' + formatDurationLabel(mins)"
                  color="primary"
                  variant="soft"
                  size="xs"
                  :disabled="!startTime"
                  @click="addToStartTime(mins)"
                />
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1 items-end justify-between">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              @click="closeAndReset"
            />
            <UButton label="OK" size="xs" class="" @click="onSelect" />
          </div>
        </div>

        <div class="text-center">
          <p
            v-if="missingValues.includes('date')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte wählen Sie ein Datum für den Beginn.
          </p>
          <p
            v-if="missingValues.includes('startTime')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte geben Sie eine Startuhrzeit an.
          </p>
          <p
            v-if="missingValues.includes('endTime')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte geben Sie eine Enduhrzeit an.
          </p>
          <p
            v-if="invalidTimeslot || invalidDateSlot"
            class="text-red-500 text-sm mt-2"
          >
            Die Endzeit muss nach der Startzeit liegen.
          </p>
        </div>
      </div>
    </Teleport>

    <!-- Small screens: popup with calendar + two time scrollers -->
    <!--<UModal
      v-if="variant === 'modal'"
      v-model:open="isOpen"
      title="Zeitraum auswählen"
      :overlay="true"
      description="Datum und Uhrzeiten für Beginn und Ende wählen."
      :ui="{
        content: 'bg-transparent divide-y-0 flex flex-col focus:outline-none',
      }"
    >
      <template #content>
        <UCard
          variant="soft"
          class="w-[min(94vw,24rem)] glass max-h-[90vh] overflow-y-auto"
        >
          <div class="flex justify-between items-center gap-2 mb-2">
            <p class="text-lg font-bold">Zeitraum auswählen</p>
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              class="rounded-xl"
              @click="closeWithoutSaving"
            />
          </div>

          <div class="flex justify-center mb-4">
            <DatePicker v-model="mobileDateRange" class="w-full" />
          </div>

          <div class="grid grid-cols-2 gap-3 mb-3">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-center">Beginn</p>
              <p class="text-xs text-center text-muted tabular-nums">
                {{ formatDateShort(dateRange[0]) || "–" }}
              </p>
              <TimePickerScroller
                :hour="timeRange.start?.hours ?? nowHour"
                :minute="timeRange.start?.minutes ?? 0"
                @update-hour="(h) => onBarScrollerHour('start', h)"
                @update-minute="(m) => onBarScrollerMinute('start', m)"
              />
            </div>
            <div class="space-y-1">
              <p class="text-sm font-semibold text-center">Ende</p>
              <p class="text-xs text-center text-muted tabular-nums">
                {{ formatDateShort(dateRange[1] ?? dateRange[0]) || "–" }}
              </p>
              <TimePickerScroller
                :hour="timeRange.end?.hours ?? nowHour"
                :minute="timeRange.end?.minutes ?? 0"
                @update-hour="(h) => onBarScrollerHour('end', h)"
                @update-minute="(m) => onBarScrollerMinute('end', m)"
              />
            </div>
          </div>

          <p
            v-if="missingValues.includes('date')"
            class="text-red-500 text-sm mb-2"
          >
            Bitte wählen Sie ein Datum.
          </p>
          <p
            v-if="
              missingValues.includes('startTime') ||
              missingValues.includes('endTime')
            "
            class="text-red-500 text-sm mb-2"
          >
            Bitte Start- und Enduhrzeit festlegen.
          </p>
          <p v-if="invalidTimeslot" class="text-red-500 text-sm mb-2">
            Die Endzeit muss nach der Startzeit liegen.
          </p>

          <div class="flex justify-end">
            <UButton label="OK" @click="onSelect" />
          </div>
        </UCard>
      </template>
    </UModal>
    -->
  </div>
</template>

<script setup lang="ts">
//import DatePicker from "./DatePicker.vue";
//import TimePickerScroller from "./TimePickerScroller.vue";
import ClearButton from "~/components/inputs/ClearButton.vue";
import PeriodField from "~/components/inputs/PeriodField.vue";
import {
  calendarDateToJsDate,
  jsDateToCalendarDate,
} from "~/utils/localDate.js";

type TimePeriod = {
  start: number | null;
  end: number | null;
};

type TimeHM = { hours: number | null; minutes: number | null } | null;

type PopoverKey = "startDate" | "startTime" | "endDate" | "endTime" | null;

const props = defineProps<{
  modelValue?: TimePeriod;
  timePeriod?: TimePeriod;
  compact?: boolean;
  /** bar = Leiste unter SearchBar; modal = Popup für kleine Screens */
  variant?: "bar" | "modal";
}>();

const emit = defineEmits<{
  (e: "update:modelValue", v: TimePeriod): void;
  (e: "update:timePeriod", v: TimePeriod): void;
  (e: "selectDate", v: TimePeriod): void;
  (e: "removeDate"): void;
  (e: "update:open", v: boolean): void;
}>();

const variant = computed(() => props.variant ?? "bar");
const panelHost = inject("searchBarDatetimePanelHost", null);
const panelHostEl = computed(() => {
  if (!panelHost) return null;
  return unref(panelHost);
});

const dateRange = ref<Date[]>([]);
const timeRange = ref<{ start: TimeHM; end: TimeHM }>({
  start: null,
  end: null,
});
const isOpen = ref(false);

const startDate = ref<Date | null>(null);
const startDateInput = computed({
  get() {
    if (!startDate.value) {
      return null;
    }
    return startDate.value.toISOString().split("T")[0];
  },
  set(v: string | null) {
    if (!v) {
      startDate.value = null;
      return;
    }
    startDate.value = new Date(v);
  },
});
watch(startDate, () => {
  if (!endDate.value) {
    setTimeout(() => (endDate.value = startDate.value), 600);
  }
});

const startTime = ref<TimeHM | null>({ hours: null, minutes: null });
const startTimeInput = computed({
  get() {
    if (
      !startTime.value ||
      startTime.value.hours === null ||
      startTime.value.minutes === null
    ) {
      return "";
    }

    const hh = startTime.value.hours.toString().padStart(2, "0");
    const mm = startTime.value.minutes.toString().padStart(2, "0");

    return `${hh}:${mm}`;
  },
  set(v: string | null) {
    if (!v) {
      startTime.value = null;
      return;
    }

    const parts = v.split(":");

    startTime.value = {
      hours: Number(parts[0]),
      minutes: Number(parts[1]),
    };
    addToStartTime(60);
  },
});

const endDate = ref<Date | null>(null);
const endDateInput = computed({
  get() {
    if (!endDate.value) {
      return null;
    }
    return endDate.value.toISOString().split("T")[0];
  },
  set(v: string | null) {
    if (!v) {
      endDate.value = null;
      return;
    }
    endDate.value = new Date(v);
  },
});

const endTime = ref<TimeHM | null>({ hours: null, minutes: null });
const endTimeInput = computed({
  get() {
    if (
      !endTime.value ||
      endTime.value.hours === null ||
      endTime.value.minutes === null
    ) {
      return "";
    }

    const hh = endTime.value.hours.toString().padStart(2, "0");
    const mm = endTime.value.minutes.toString().padStart(2, "0");

    return `${hh}:${mm}`;
  },
  set(v: string | null) {
    if (!v) {
      endTime.value = null;
      return;
    }

    const parts = v.split(":");

    endTime.value = {
      hours: Number(parts[0]),
      minutes: Number(parts[1]),
    };
  },
});

const openPopover = ref<PopoverKey>(null);
const missingValues = ref<string[]>([]);
const endTimeAutoSet = ref(false);
const durationPresets = [60, 120, 240];

const now = computed(() => new Date());

const startDateFocused = ref(false);
const endDateFocused = ref(false);
const startCalendarDate = shallowRef(jsDateToCalendarDate(null));
const endCalendarDate = shallowRef(jsDateToCalendarDate(null));
const startPickerDate = ref<Date | null>(null);
const endPickerDate = ref<Date | null>(null);
const confirmedPeriod = ref<TimePeriod | null>(null);

const invalidDateSlot = computed(() => {
  if (
    dateRange.value.length === 0 ||
    (dateRange.value[0] && !dateRange.value[1])
  ) {
    return false;
  } else if (!dateRange.value[0] && dateRange.value[1]) {
    return true;
  }

  const start = dateRange.value[0];
  const end = dateRange.value[1];

  return end < start;
});
const invalidTimeslot = computed(() => {
  if (
    !timeRange.value.start?.hours ||
    !timeRange.value.start?.minutes ||
    !timeRange.value.end?.hours ||
    !timeRange.value.end?.minutes
  ) {
    return false;
  }

  const startTotalMinutes =
    timeRange.value.start.hours * 60 + timeRange.value.start.minutes;
  const endTotalMinutes =
    timeRange.value.end.hours * 60 + timeRange.value.end.minutes;

  return endTotalMinutes <= startTotalMinutes;
});

const coalesceModel = computed<TimePeriod>(() => {
  const v = props.timePeriod ?? props.modelValue ?? { start: null, end: null };

  return {
    start: typeof v.start === "number" ? v.start : null,
    end: typeof v.end === "number" ? v.end : null,
  };
});

const hasAnyValue = computed(
  () =>
    !!(coalesceModel.value.start && coalesceModel.value.end) ||
    dateRange.value.length > 0 ||
    !!timeRange.value.start ||
    !!timeRange.value.end,
);

const hasConfirmedDisplay = computed(() => {
  const source = confirmedPeriod.value ?? coalesceModel.value;
  return !!(source.start && source.end);
});

/*const mobileDateRange = computed({
  get() {
    if (!dateRange.value.length) return null;
    if (dateRange.value.length === 1) return [dateRange.value[0], null];
    return [...dateRange.value];
  },
  set(v: Date[] | Date | null) {
    if (!v) {
      dateRange.value = [];
      return;
    }
    if (Array.isArray(v)) {
      const next = v
        .filter(Boolean)
        .map((d) => normalizeDate(d))
        .filter(Boolean) as Date[];
      dateRange.value = next;
      removeValidation();
      return;
    }
    applyStartDate(v);
  },
});*/

watch(
  coalesceModel,
  (v) => {
    syncInFromModel(v);
    if (v.start && v.end) {
      confirmedPeriod.value = { ...v };
    }
  },
  { immediate: true, deep: true },
);

watch(
  () => dateRange.value[0],
  (d) => {
    if (!startDateFocused.value) {
      startCalendarDate.value = jsDateToCalendarDate(d ?? null);
    }
    startPickerDate.value = normalizeDate(d);
  },
  { immediate: true },
);

watch(
  () => dateRange.value[1] ?? dateRange.value[0],
  (d) => {
    if (!endDateFocused.value) {
      endCalendarDate.value = jsDateToCalendarDate(d ?? null);
    }
    endPickerDate.value = normalizeDate(d);
  },
  { immediate: true },
);

watch(startCalendarDate, (val) => {
  if (!startDateFocused.value || !isCompleteCalendarDate(val)) return;
  applyStartDate(calendarDateToJsDate(val));
});

watch(endCalendarDate, (val) => {
  if (!endDateFocused.value || !isCompleteCalendarDate(val)) return;
  applyEndDate(calendarDateToJsDate(val));
});

watch(startPickerDate, (d) => {
  if (!d) return;
  const normalized = normalizeDate(d);
  const current = normalizeDate(dateRange.value[0]);
  if (!normalized || (current && current.getTime() === normalized.getTime())) {
    return;
  }
  applyStartDate(normalized);
  openPopover.value = null;
});

watch(endPickerDate, (d) => {
  if (!d) return;
  const normalized = normalizeDate(d);
  const current = normalizeDate(dateRange.value[1] ?? dateRange.value[0]);
  if (!normalized || (current && current.getTime() === normalized.getTime())) {
    return;
  }
  applyEndDate(normalized);
  openPopover.value = null;
});

watch(isOpen, (open) => {
  emit("update:open", open);
  if (!open) openPopover.value = null;
});

function toggleOpen() {
  if (isOpen.value) {
    closeAndReset();
  } else {
    isOpen.value = true;
    syncInFromModel(coalesceModel.value);
  }
}

function isCompleteCalendarDate(
  val: { year?: number; month?: number; day?: number } | null,
) {
  return !!(val?.year && val?.month && val?.day && val.year >= 1000);
}

function normalizeDate(value: unknown): Date | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value as string | number);
  if (Number.isNaN(d.getTime())) return null;
  const result = new Date(d);
  result.setFullYear(d.getFullYear(), d.getMonth(), d.getDate());
  result.setHours(0, 0, 0, 0);
  return result;
}

function applyStartDate(d: Date | null) {
  const normalized = normalizeDate(d);
  if (!normalized) return;
  const next = [...dateRange.value];
  next[0] = normalized;
  if (!next[1]) next[1] = normalized;
  dateRange.value = next;
  startCalendarDate.value = jsDateToCalendarDate(normalized);
  removeValidation();
}

function applyEndDate(d: Date | null) {
  const normalized = normalizeDate(d);
  if (!normalized) return;
  const next = [...dateRange.value];
  if (!next[0]) next[0] = normalized;
  next[1] = normalized;
  dateRange.value = next;
  endCalendarDate.value = jsDateToCalendarDate(normalized);
  removeValidation();
}

/*function onBarScrollerHour(side: "start" | "end", hour: number) {
  const current =
    side === "start" ? timeRange.value.start : timeRange.value.end;
  applyTime(side, hour, current?.minutes ?? 0);
}*/

/*function onBarScrollerMinute(side: "start" | "end", minute: number) {
  const current =
    side === "start" ? timeRange.value.start : timeRange.value.end;
  applyTime(side, current?.hours ?? nowHour.value, minute);
}*/

/*function applyTime(side: "start" | "end", hours: number, minutes: number) {
  if (side === "start") {
    timeRange.value.start = { hours, minutes };
    setDefaultEndTime();
  } else {
    endTimeAutoSet.value = false;
    timeRange.value.end = { hours, minutes };
    removeValidation();
  }
}*/

function setPeriodToNow() {
  const now = new Date();
  startDate.value = now;
  startTime.value = { hours: now.getHours(), minutes: now.getMinutes() };

  if (!endDate.value) endDate.value = now;
}
function setPeriodDateFromNow(slot: "start" | "end", addedDays: number) {
  const now = new Date();

  if (slot === "start") {
    startDate.value = addToDate(now, addedDays);
  }
  if (slot === "end") {
    endDate.value = addToDate(now, addedDays);
  }
}

function setPeriodTimeFromNow(slot: "start" | "end", addedMinuted: number) {
  const now = new Date();

  if (slot === "start") {
    startTime.value = addToTime(
      { hours: now.getHours(), minutes: now.getMinutes() },
      addedMinuted,
    );
  }
  if (slot === "end") {
    if (
      !startTime.value ||
      !startTime.value.hours ||
      !startTime.value.minutes
    ) {
      endTime.value = addToTime(
        { hours: now.getHours(), minutes: now.getMinutes() },
        addedMinuted,
      );
    }
    endTime.value = addToTime(startTime.value, addedMinuted);
  }
}

function syncInFromModel(v: TimePeriod) {
  if (!v || (!v.start && !v.end)) {
    dateRange.value = [];
    timeRange.value = { start: null, end: null };
    endTimeAutoSet.value = false; //toDo - Weg damit?!
    return;
  }

  endTimeAutoSet.value = false; //toDo - Weg damit?!

  const start = v.start ? new Date(v.start) : null;
  const end = v.end ? new Date(v.end) : null;

  if (start) {
    startDate.value = start;
    startTime.value = {
      hours: start.getHours(),
      minutes: start.getMinutes(),
    };
  }
  if (end) {
    endDate.value = end || null;

    endTime.value = {
      hours: end.getHours(),
      minutes: end.getMinutes(),
    };
  }
}

function buildTimestampsFromState(): TimePeriod {
  const [d0, d1] = dateRange.value;
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

function formatDate(dateStr: string | number | Date) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatTime(timeObj: { hours: number; minutes: number } | null) {
  if (!timeObj) return "";
  const hours = String(timeObj.hours).padStart(2, "0");
  const minutes = String(timeObj.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function formatDateTimeRange(
  dates: Date[],
  times: { start: TimeHM; end: TimeHM },
) {
  const source = confirmedPeriod.value ?? coalesceModel.value;
  if (source.start && source.end) {
    const start = new Date(source.start);
    const end = new Date(source.end);
    const sameDay =
      start.getFullYear() === end.getFullYear() &&
      start.getMonth() === end.getMonth() &&
      start.getDate() === end.getDate();
    const startDate = formatDate(start);
    const endDate = formatDate(end);
    const startTime = formatTime({
      hours: start.getHours(),
      minutes: start.getMinutes(),
    });
    const endTime = formatTime({
      hours: end.getHours(),
      minutes: end.getMinutes(),
    });
    if (sameDay) return `${startDate} ${startTime} - ${endTime}`;
    return `${startDate} ${startTime} - ${endDate} ${endTime}`;
  }

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
  const startTime = formatTime(times.start);
  const endTime = formatTime(times.end);
  if (sameDay) return `${startDate} ${startTime} - ${endTime}`;
  return `${startDate} ${startTime} - ${endDate} ${endTime}`;
}

function formatDurationLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `0:${String(m).padStart(2, "0")}h`;
  if (m === 0) return `${h}:00h`;
  return `${h}:${String(m).padStart(2, "0")}h`;
}

function closeAndReset() {
  isOpen.value = false;

  startDate.value = null;
  endDate.value = null;
  startTime.value = { hours: null, minutes: null };
  endTime.value = { hours: null, minutes: null };

  syncInFromModel(coalesceModel.value);
  missingValues.value = [];
}

function addToDate(date: Date, addedDays: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + addedDays);
  return result;
}
function addToTime(time: TimeHM, addedMinutes: number): TimeHM {
  let totalMinutes = 0;
  if (!time || time.hours === null || time.minutes === null) {
    totalMinutes =
      now.value.getHours() * 60 + now.value.getMinutes() + addedMinutes;
  } else {
    totalMinutes = time.hours * 60 + time.minutes + addedMinutes;
  }
  return {
    hours: Math.floor(totalMinutes / 60) % 24,
    minutes: totalMinutes % 60,
  };
}

function addToStartTime(addedMinutes: number) {
  endTime.value = addToTime(startTime.value, addedMinutes);
}

function removeValidation() {
  if (dateRange.value.length > 0) {
    missingValues.value = missingValues.value.filter((m) => m !== "date");
  }
  if (timeRange.value.start) {
    missingValues.value = missingValues.value.filter((m) => m !== "startTime");
  }
  if (timeRange.value.end) {
    missingValues.value = missingValues.value.filter((m) => m !== "endTime");
  }
}

function useValidation() {
  if (dateRange.value.length === 0) {
    if (!missingValues.value.includes("date")) missingValues.value.push("date");
  }

  if (!timeRange.value.start?.hours || !timeRange.value.start?.minutes) {
    if (!missingValues.value.includes("startTime"))
      missingValues.value.push("startTime");
  }
  if (!timeRange.value.end?.hours || !timeRange.value.start?.minutes) {
    if (!missingValues.value.includes("endTime")) {
      missingValues.value.push("endTime");
    }
  }
}

function onSelect() {
  const start = startDate.value;
  const end = endDate.value;
  console.log("Datum - Start - Ende: ", start, end);

  if (start && end) {
    dateRange.value = [start, end];
  } else if (start) {
    dateRange.value = [start, start];
  } else if (end) {
    dateRange.value = [end, end];
  }

  timeRange.value = {
    start: startTime.value,
    end: endTime.value,
  };

  // Validation
  removeValidation();
  useValidation();
  if (missingValues.value.length > 0) return;

  if (invalidTimeslot.value || invalidDateSlot.value) return;

  const result = buildTimestampsFromState();
  confirmedPeriod.value = result;
  isOpen.value = false;
  openPopover.value = null;
  emit("update:timePeriod", result);
  emit("update:modelValue", result);
  emit("selectDate", result);
}

function onDeleteTimePeriod() {
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
  missingValues.value = [];
  endTimeAutoSet.value = false; //toDo - weg damit???
  confirmedPeriod.value = null; //toDo - weg damit???
  isOpen.value = false;

  startDate.value = null;
  startTime.value = { hours: null, minutes: null };
  endDate.value = null;
  endTime.value = { hours: null, minutes: null };

  const cleared: TimePeriod = { start: null, end: null };
  emit("update:timePeriod", cleared);
  emit("update:modelValue", cleared);
  emit("removeDate");
}
</script>

<style scoped>
:deep(.period-date-input),
:deep(.period-time-input) {
  font-variant-numeric: tabular-nums;
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
  background-color: #f3f4f6;
  color: #9ca3af;
  cursor: not-allowed;
}
</style>
