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
        isOpen && !compact ? 'md:ring-1 md:ring-primary/40' : '',
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
        <div class="flex justify-between gap-2 p-2">
          <div class="flex justify-center w-full gap-5">
            <div
              class="text-xs font-semibold text-muted shrink-0 w-12 h-10 flex items-center"
            >
              Beginn
            </div>
            <InputTime
              v-model:date="startDate"
              v-model:time="startTime"
              :missing-values="missingValues.start"
              :is-invalid-date="invalidDateSlot"
              :is-invalid-time="invalidTimeslot"
            >
              <template #buttons>
                <div class="my-2">
                  <UButton
                    label="Jetzt"
                    color="primary"
                    variant="soft"
                    size="xs"
                    @click="setPeriodToNow"
                  />
                </div>
              </template>
            </InputTime>

            <span class="text-muted select-none px-0.5 h-10 flex items-center"
              >→</span
            >

            <div
              class="text-xs font-semibold text-muted shrink-0 w-8 h-10 flex items-center"
            >
              Ende
            </div>
            <InputTime
              v-model:date="endDate"
              v-model:time="endTime"
              :missing-values="missingValues.end"
              :is-invalid-date="invalidDateSlot"
              :is-invalid-time="invalidTimeslot"
            >
              <template #buttons>
                <div class="flex gap-1 my-2">
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
              </template>
            </InputTime>
          </div>

          <div class="flex flex-col gap-1 items-end justify-between">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-x"
              size="sm"
              @click="closeAndReset"
            />
            <UButton label="OK" size="md" class="" @click="onSelect" />
          </div>
        </div>

        <div class="text-center">
          <p
            v-if="missingValues.start.includes('date')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte wählen Sie ein Datum für den Beginn.
          </p>
          <p
            v-if="missingValues.start.includes('time')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte geben Sie eine Startuhrzeit an.
          </p>
          <p
            v-if="missingValues.end.includes('time')"
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

    <!-- Small screens: Slideover from bottom -->
    <USlideover
      v-if="variant === 'modal'"
      v-model:open="isOpen"
      side="bottom"
      inset
      title="Zeitraum auswählen"
      description="Beginn und Ende der Buchung festlegen."
      :ui="{
        overlay: 'bg-black/60',
        content: 'w-[94vw] mx-auto rounded-t-2xl shadow-lg max-h-[85vh] pb-2',
        header: 'min-h-0 py-3 px-4',
        body: 'px-4 py-2 overflow-y-auto',
        footer: 'px-4 py-3 border-t border-default',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between w-full gap-2">
          <p class="text-base font-semibold">Zeitraum auswählen</p>
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-x"
            size="sm"
            class="rounded-xl"
            @click="closeAndReset"
          />
        </div>
      </template>

      <template #body>
        <div class="space-y-1 pb-2">
          <!-- BEGIN -->
          <PeriodFieldCompact
            v-model:date="startDate"
            v-model:time="startTime"
            :missing-values="missingValues.start"
          >
            <template #quickAccessButtons>
              <UButton
                label="Jetzt"
                color="primary"
                variant="soft"
                size="xs"
                @click="setPeriodToNow"
              />
            </template>
          </PeriodFieldCompact>

          <USeparator />
          <!-- END -->
          <PeriodFieldCompact
            v-model:date="endDate"
            v-model:time="endTime"
            :missing-values="missingValues.end"
          >
            <template #quickAccessButtons>
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
            </template>
          </PeriodFieldCompact>

          <p
            v-if="
              missingValues.start.includes('date') ||
              missingValues.end.includes('date')
            "
            class="text-red-500 text-sm mt-2"
          >
            Bitte wählen Sie ein Datum für den Beginn.
          </p>
          <p
            v-if="missingValues.start.includes('time')"
            class="text-red-500 text-sm mt-2"
          >
            Bitte geben Sie eine Startuhrzeit an.
          </p>
          <p
            v-if="missingValues.end.includes('time')"
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
      </template>

      <template #footer>
        <div class="flex gap-2 w-full">
          <UButton
            label="Abbrechen"
            color="neutral"
            variant="soft"
            class="flex-1 justify-center"
            @click="closeAndReset"
          />
          <UButton label="OK" class="flex-1 justify-center" @click="onSelect" />
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
import ClearButton from "~/components/inputs/ClearButton.vue";
import PeriodFieldCompact from "~/components/inputs/PeriodFieldCompact.vue";
import PeriodField from "~/components/inputs/PeriodField.vue";
import InputTime from "~/components/inputs/InputTime.vue";

type TimePeriod = {
  start: number | null;
  end: number | null;
};

type TimeHM = { hours: number | null; minutes: number | null } | null;
type MissingValues = { start: string[]; end: string[] };

const props = defineProps<{
  timePeriod?: TimePeriod;
  compact?: boolean;
  variant?: "bar" | "modal";
}>();

const emit = defineEmits<{
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
const startTime = ref<TimeHM | null>({ hours: null, minutes: null });

watch(startDate, () => {
  if (!endDate.value) {
    setTimeout(() => (endDate.value = startDate.value), 600);
  }
});
watch(startTime, () => {
  if (!endTime.value || !endTime.value.hours || !endTime.value.minutes) {
    addToStartTime(60);
  }
});

const endDate = ref<Date | null>(null);
const endTime = ref<TimeHM | null>({ hours: null, minutes: null });

const missingValues = ref<MissingValues>({ start: [], end: [] });
const durationPresets = [60, 120, 240];

const now = computed(() => new Date());

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

const confirmedPeriod = computed<TimePeriod>(() => {
  const v = props.timePeriod ?? { start: null, end: null };

  return {
    start: typeof v.start === "number" ? v.start : null,
    end: typeof v.end === "number" ? v.end : null,
  };
});

const hasAnyValue = computed(
  () => !!(confirmedPeriod.value.start && confirmedPeriod.value.end),
);

const hasConfirmedDisplay = computed(() => {
  const source = confirmedPeriod.value;
  return !!(source.start && source.end);
});

watch(
  confirmedPeriod,
  (v) => {
    syncInFromModel(v);
  },
  { immediate: true, deep: true },
);

function toggleOpen() {
  if (isOpen.value) {
    closeAndReset();
  } else {
    isOpen.value = true;
    syncInFromModel(confirmedPeriod.value);
  }
}

function setPeriodToNow() {
  const now = new Date();
  startDate.value = now;
  startTime.value = { hours: now.getHours(), minutes: now.getMinutes() };

  if (!endDate.value) endDate.value = now;
}

function syncInFromModel(v: TimePeriod) {
  if (!v || (!v.start && !v.end)) {
    dateRange.value = [];
    timeRange.value = { start: null, end: null };
    return;
  }

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
    d0 &&
    timeRange.value.start &&
    timeRange.value.start.hours !== null &&
    timeRange.value.start.minutes !== null
      ? dateToTimestampWithTime(d0, timeRange.value.start)
      : null;

  const endTs =
    baseEndDate &&
    timeRange.value.end &&
    timeRange.value.end.hours !== null &&
    timeRange.value.end.minutes !== null
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

function formatTime(
  timeObj: { hours: number | null; minutes: number | null } | null,
) {
  if (!timeObj || timeObj.hours === null || timeObj.minutes === null) return "";
  const hours = String(timeObj.hours).padStart(2, "0");
  const minutes = String(timeObj.minutes).padStart(2, "0");
  return `${hours}:${minutes}`;
}

// format for display in SearchBar
function formatDateTimeRange(
  dates: Date[],
  times: { start: TimeHM; end: TimeHM },
) {
  const source = confirmedPeriod.value;
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

//format for quick access buttons
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

  syncInFromModel(confirmedPeriod.value);
  missingValues.value = { start: [], end: [] };
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
    missingValues.value.start = missingValues.value.start.filter(
      (m) => m !== "date",
    );
    missingValues.value.end = missingValues.value.end.filter(
      (m) => m !== "date",
    );
  }
  if (timeRange.value.start) {
    missingValues.value.start = missingValues.value.start.filter(
      (m) => m !== "time",
    );
  }
  if (timeRange.value.end) {
    missingValues.value.end = missingValues.value.end.filter(
      (m) => m !== "time",
    );
  }
}

function useValidation() {
  if (dateRange.value.length === 0) {
    if (!missingValues.value.start.includes("date"))
      missingValues.value.start.push("date");
    if (!missingValues.value.end.includes("date"))
      missingValues.value.end.push("date");
  }

  if (!timeRange.value.start?.hours || !timeRange.value.start?.minutes) {
    if (!missingValues.value.start.includes("time"))
      missingValues.value.start.push("time");
  }
  if (!timeRange.value.end?.hours || !timeRange.value.end?.minutes) {
    if (!missingValues.value.end.includes("time")) {
      missingValues.value.end.push("time");
    }
  }
}

function onSelect() {
  const start = startDate.value;
  const end = endDate.value;

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

  if (
    missingValues.value.start.length > 0 ||
    missingValues.value.end.length > 0
  )
    return;

  if (invalidTimeslot.value || invalidDateSlot.value) return;

  const result = buildTimestampsFromState();
  isOpen.value = false;
  emit("update:timePeriod", result);
  emit("selectDate", result);
}

function onDeleteTimePeriod() {
  dateRange.value = [];
  timeRange.value = { start: null, end: null };
  missingValues.value = { start: [], end: [] };
  isOpen.value = false;

  startDate.value = null;
  startTime.value = { hours: null, minutes: null };
  endDate.value = null;
  endTime.value = { hours: null, minutes: null };

  const cleared: TimePeriod = { start: null, end: null };
  emit("update:timePeriod", cleared);
  emit("removeDate");
}
</script>

<style scoped>
:deep(.period-date-input),
:deep(.period-time-input) {
  font-variant-numeric: tabular-nums;
}
</style>
