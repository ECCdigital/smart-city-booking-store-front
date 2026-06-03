<template>
  <div class="space-y-5">
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <label
          class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
        >
          {{ $t("scheduleSelection.startTimePoint") }}
        </label>
        <InputTime
          v-model="startTime"
          v-model:date="startInputDate"
          show-date
          class="w-full"
          @update:model-value="onStartTimeChange"
          @update:date="onStartTimeChange"
        />
      </div>
      <div>
        <label
          class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
        >
          {{ $t("scheduleSelection.endTimePoint") }}
        </label>
        <InputTime
          v-model="endTime"
          v-model:date="endInputDate"
          show-date
          :disabled="!startTime"
          class="w-full"
          @update:model-value="onManualInputChange"
          @update:date="onManualInputChange"
        />
      </div>
    </div>

    <button
      type="button"
      class="sm:hidden inline-flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      :aria-expanded="calendarVisibleOnMobile"
      @click="toggleCalendarOnMobile"
    >
      <UIcon
        :name="
          calendarVisibleOnMobile
            ? 'i-lucide-calendar-x'
            : 'i-lucide-calendar-days'
        "
        class="flex-shrink-0"
        size="18"
      />
      {{
        calendarVisibleOnMobile
          ? $t("scheduleSelection.hideOccupancy")
          : $t("scheduleSelection.showOccupancy")
      }}
    </button>

    <div v-if="showCalendarPanel">
      <div
        class="flex items-center justify-between px-3 py-1.5 rounded-t-md border border-b-0 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
      >
        <button
          type="button"
          :disabled="!canGoPrev"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          @click="navigatePrev"
        >
          &larr; {{ $t("scheduleSelection.previousWeek") }}
        </button>

        <div class="flex items-center gap-2">
          <span class="font-semibold text-sm text-gray-800 dark:text-gray-200">
            {{ dateRangeLabel }}
          </span>
          <DateJumper @select="onJumpDate" />
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          @click="navigateNext"
        >
          {{ $t("scheduleSelection.nextWeek") }} &rarr;
        </button>
      </div>

      <div
        class="rounded-b-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900"
      >
        <!-- FullCalendar -->
        <ClientOnly>
          <div class="fc-wrapper">
            <FullCalendar ref="calendarRef" :options="calendarOptions" />
          </div>
          <template #fallback>
            <div class="flex items-center justify-center py-20">
              <UIcon
                name="i-lucide-loader-2"
                class="animate-spin text-gray-400"
                size="24"
              />
            </div>
          </template>
        </ClientOnly>

        <!-- Legend -->
        <div
          class="flex items-center gap-4 px-3 py-1.5 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-600 dark:text-gray-400"
        >
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-4 h-3 rounded-sm border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-950/50"
            />
            {{ $t("scheduleSelection.free") }}
          </span>
          <span class="flex items-center gap-1.5">
            <span class="inline-block w-4 h-3 rounded-sm occupied-legend" />
            {{ $t("scheduleSelection.occupied") }}
          </span>
          <span class="flex items-center gap-1.5">
            <span
              class="inline-block w-4 h-3 rounded-sm bg-primary/90 dark:bg-primary/10"
            />
            {{ $t("scheduleSelection.yourSelection") }}
          </span>
        </div>
      </div>
    </div>

    <!-- Overlap warning -->
    <div
      v-if="overlapWarning"
      class="flex items-start gap-2.5 p-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50"
    >
      <UIcon
        name="i-lucide-alert-triangle"
        class="text-amber-500 flex-shrink-0 mt-0.5"
        size="18"
      />
      <p class="text-sm text-amber-700 dark:text-amber-300">
        {{ $t("scheduleSelection.overlapWarning") }}
      </p>
    </div>

    <!-- Hint -->
    <p
      v-if="showCalendarPanel"
      class="text-xs text-gray-400 dark:text-gray-500 italic"
    >
      {{ $t("scheduleSelection.dragHint") }}
    </p>
  </div>
</template>

<script setup>
import FullCalendar from "@fullcalendar/vue3";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import deLocale from "@fullcalendar/core/locales/de";
import { useMediaQuery } from "@vueuse/core";
import { useBookables } from "~/composables/api/useBookables.js";
import DateJumper from "~/components/inputs/DateJumper.vue";
import InputTime from "~/components/inputs/InputTime.vue";

const props = defineProps({
  tenantId: { type: String, default: null },
  bookableId: { type: String, default: null },
  amount: { type: Number, default: 1 },
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
});

const emit = defineEmits(["update:modelValue", "change"]);
const { getBookableAvailability } = useBookables();

/* ── helpers ─────────────────────────────────────────────── */
function pad2(n) {
  return n.toString().padStart(2, "0");
}

function localISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
}

function parseLocalDate(iso) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function getMonday(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const dow = d.getDay();
  d.setDate(d.getDate() + (dow === 0 ? -6 : 1 - dow));
  return d;
}

/* ── state ───────────────────────────────────────────────── */
const today = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();
const todayISO = localISODate(today);

const calendarRef = ref(null);
const calendarVisibleOnMobile = ref(false);
const isSmUp = useMediaQuery("(min-width: 640px)");
const showCalendarPanel = computed(
  () => isSmUp.value || calendarVisibleOnMobile.value,
);
const currentViewStart = ref(null);
const currentViewEnd = ref(null);

const startDateInput = ref("");
const startTimeInput = ref("");
const endDateInput = ref("");
const endTimeInput = ref("");

const availability = ref([]);
const isLoadingAvailability = ref(false);

/* ── FullCalendar API access ─────────────────────────────── */
function getApi() {
  return calendarRef.value?.getApi?.() ?? null;
}

function toggleCalendarOnMobile() {
  calendarVisibleOnMobile.value = !calendarVisibleOnMobile.value;
}

watch(showCalendarPanel, (visible) => {
  if (!visible) return;
  nextTick(() => {
    getApi()?.updateSize();
  });
});

function ensureAvailabilityForInputs() {
  if (showCalendarPanel.value) return;
  if (!props.tenantId || !props.bookableId || !startDateInput.value) return;

  const sd = parseLocalDate(startDateInput.value);
  if (!sd) return;

  const start = getMonday(sd);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  fetchAvailability(start, end);
}

/* ── navigation ──────────────────────────────────────────── */
function navigatePrev() {
  const api = getApi();
  if (api) api.prev();
}

function navigateNext() {
  const api = getApi();
  if (api) api.next();
}

const canGoPrev = computed(() => {
  if (!currentViewStart.value) return true;
  const thisMonday = getMonday(today);
  return currentViewStart.value.getTime() > thisMonday.getTime();
});

function onJumpDate(date) {
  if (!date) return;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d < getMonday(today)) return;
  const api = getApi();
  if (api) api.gotoDate(d);
}

/* ── date range label ───────────────────────────────────── */
const dateRangeLabel = computed(() => {
  if (!currentViewStart.value || !currentViewEnd.value) return "";
  const start = currentViewStart.value;
  // FullCalendar end is exclusive – subtract a day for display
  const end = new Date(currentViewEnd.value);
  end.setDate(end.getDate() - 1);

  const fmtDate = (d) => {
    const day = pad2(d.getDate());
    const month = d
      .toLocaleDateString("de-DE", { month: "short" })
      .replace(/\.$/, "");
    return `${day}. ${month}`;
  };

  return `${fmtDate(start)} – ${fmtDate(end)} ${end.getFullYear()}`;
});

/* ── availability cache + fetch ──────────────────────────── */
const availabilityCache = new Map();

async function fetchAvailability(start, end) {
  if (!props.tenantId || !props.bookableId) {
    availability.value = [];
    return;
  }

  const sMs = start.getTime();
  const eMs = end.getTime();
  const key = `${props.tenantId}|${props.bookableId}|${sMs}|${eMs}|${props.amount}`;

  if (availabilityCache.has(key)) {
    availability.value = availabilityCache.get(key);
    return;
  }

  isLoadingAvailability.value = true;
  try {
    const data = await getBookableAvailability({
      tenantID: props.tenantId,
      bookableId: props.bookableId,
      start: start.toISOString(),
      end: end.toISOString(),
      amount: props.amount,
    });

    // API may return array directly or { availability: [...] }
    const raw = Array.isArray(data)
      ? data
      : Array.isArray(data?.availability)
        ? data.availability
        : [];

    availabilityCache.set(key, raw);
    availability.value = raw;
  } catch {
    availability.value = [];
  } finally {
    isLoadingAvailability.value = false;
  }
}

watch(
  () => [props.tenantId, props.bookableId, props.amount],
  () => {
    availabilityCache.clear();
    if (currentViewStart.value && currentViewEnd.value) {
      fetchAvailability(currentViewStart.value, currentViewEnd.value);
    }
  },
);

/* ── calendar events (occupied + selection) ──────────────── */
const calendarEvents = computed(() => {
  const events = [];

  // Occupied (background events)
  for (const iv of availability.value) {
    if (!iv.available) {
      events.push({
        start: new Date(iv.timeBegin),
        end: new Date(iv.timeEnd),
        display: "background",
        classNames: ["fc-occupied"],
      });
    }
  }

  // User selection (regular event)
  if (
    startDateInput.value &&
    startTimeInput.value &&
    endDateInput.value &&
    endTimeInput.value
  ) {
    const sd = parseLocalDate(startDateInput.value);
    const ed = parseLocalDate(endDateInput.value);
    if (sd && ed) {
      const [sh, sm] = startTimeInput.value.split(":").map(Number);
      const [eh, em] = endTimeInput.value.split(":").map(Number);
      const start = new Date(
        sd.getFullYear(),
        sd.getMonth(),
        sd.getDate(),
        sh,
        sm || 0,
      );
      const end = new Date(
        ed.getFullYear(),
        ed.getMonth(),
        ed.getDate(),
        eh,
        em || 0,
      );
      if (end > start) {
        events.push({
          id: "user-selection",
          title: "",
          start,
          end,
          display: "auto",
          classNames: ["fc-user-selection"],
          editable: false,
        });
      }
    }
  }

  return events;
});

/* ── day header renderer ─────────────────────────────────── */
function renderDayHeader(arg) {
  const d = arg.date;
  const weekday = d
    .toLocaleDateString("de-DE", { weekday: "short" })
    .replace(/\.$/, "");
  const day = d.getDate();
  const isToday = localISODate(d) === todayISO;
  const cls = isToday ? "fc-day-header--today" : "";

  return {
    html:
      '<div class="fc-day-header-inner ' +
      cls +
      '">' +
      '<div class="fc-day-header-weekday">' +
      weekday +
      "</div>" +
      '<div class="fc-day-header-number">' +
      day +
      "</div>" +
      "</div>",
  };
}

/* ── calendar callbacks ──────────────────────────────────── */
function handleCalendarSelect(info) {
  startDateInput.value = localISODate(info.start);
  startTimeInput.value = `${pad2(info.start.getHours())}:${pad2(
    info.start.getMinutes(),
  )}`;
  endDateInput.value = localISODate(info.end);
  endTimeInput.value = `${pad2(info.end.getHours())}:${pad2(
    info.end.getMinutes(),
  )}`;
  emitValue();

  // Clear FullCalendar's built-in highlight – our event takes over
  nextTick(() => {
    const api = getApi();
    if (api) api.unselect();
  });
}

function handleDatesSet(info) {
  currentViewStart.value = info.start;
  currentViewEnd.value = info.end;
  fetchAvailability(info.start, info.end);
}

/* ── calendar options ────────────────────────────────────── */
const calendarOptions = computed(() => ({
  plugins: [timeGridPlugin, interactionPlugin],
  initialView: "timeGridWeek",
  locale: deLocale,
  firstDay: 1,
  headerToolbar: false,
  allDaySlot: false,
  nowIndicator: true,
  slotMinTime: "00:00:00",
  slotMaxTime: "24:00:00",
  slotDuration: "01:00:00",
  slotLabelInterval: "02:00:00",
  slotLabelFormat: {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  },
  dayHeaderContent: renderDayHeader,
  height: "auto",
  selectable: true,
  selectMirror: true,
  unselectAuto: true,
  selectOverlap: true,
  snapDuration: "00:15:00",
  events: calendarEvents.value,
  select: handleCalendarSelect,
  datesSet: handleDatesSet,
  validRange: { start: localISODate(getMonday(today)) },
}));

function timeFromString(str) {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  return { hours: h, minutes: m || 0 };
}

function timeToString({ hours, minutes }) {
  return `${pad2(hours)}:${pad2(minutes)}`;
}

/* ── InputTime bindings ──────────────────────────────────── */
const startTime = computed({
  get: () => timeFromString(startTimeInput.value),
  set(val) {
    startTimeInput.value = val ? timeToString(val) : "";
  },
});

const endTime = computed({
  get: () => timeFromString(endTimeInput.value),
  set(val) {
    endTimeInput.value = val ? timeToString(val) : "";
  },
});

const startInputDate = computed({
  get: () => parseLocalDate(startDateInput.value),
  set(d) {
    startDateInput.value = d ? localISODate(d) : "";
  },
});

const endInputDate = computed({
  get: () => parseLocalDate(endDateInput.value),
  set(d) {
    endDateInput.value = d ? localISODate(d) : "";
  },
});

function applyDefaultEndFromStart() {
  if (!startDateInput.value || !startTimeInput.value) return;

  const sd = parseLocalDate(startDateInput.value);
  if (!sd) return;

  const [sh, sm] = startTimeInput.value.split(":").map(Number);
  const start = new Date(
    sd.getFullYear(),
    sd.getMonth(),
    sd.getDate(),
    sh,
    sm || 0,
  );

  if (endDateInput.value && endTimeInput.value) {
    const ed = parseLocalDate(endDateInput.value);
    if (ed) {
      const [eh, em] = endTimeInput.value.split(":").map(Number);
      const end = new Date(
        ed.getFullYear(),
        ed.getMonth(),
        ed.getDate(),
        eh,
        em || 0,
      );
      if (end > start) return;
    }
  }

  const end = new Date(start);
  end.setHours(end.getHours() + 1);
  endDateInput.value = localISODate(end);
  endTimeInput.value = `${pad2(end.getHours())}:${pad2(end.getMinutes())}`;
}

function onStartTimeChange() {
  applyDefaultEndFromStart();
  onManualInputChange();
}

/* ── manual input change ─────────────────────────────────── */
function onManualInputChange() {
  emitValue();
  ensureAvailabilityForInputs();

  // Navigate calendar to the start date if it is outside the current view
  if (startDateInput.value) {
    const api = getApi();
    if (api) {
      const sd = parseLocalDate(startDateInput.value);
      if (
        sd &&
        currentViewStart.value &&
        currentViewEnd.value &&
        (sd < currentViewStart.value || sd >= currentViewEnd.value)
      ) {
        api.gotoDate(sd);
      }
    }
  }
}

/* ── overlap warning ─────────────────────────────────────── */
const overlapWarning = computed(() => {
  if (
    !startDateInput.value ||
    !startTimeInput.value ||
    !endDateInput.value ||
    !endTimeInput.value
  ) {
    return false;
  }

  const sd = parseLocalDate(startDateInput.value);
  const ed = parseLocalDate(endDateInput.value);
  if (!sd || !ed) return false;

  const [sh, sm] = startTimeInput.value.split(":").map(Number);
  const [eh, em] = endTimeInput.value.split(":").map(Number);

  const startMs = new Date(
    sd.getFullYear(),
    sd.getMonth(),
    sd.getDate(),
    sh,
    sm || 0,
  ).getTime();
  const endMs = new Date(
    ed.getFullYear(),
    ed.getMonth(),
    ed.getDate(),
    eh,
    em || 0,
  ).getTime();

  if (endMs <= startMs) return false;

  for (const iv of availability.value) {
    if (iv.timeBegin < endMs && iv.timeEnd > startMs && !iv.available) {
      return true;
    }
  }
  return false;
});

/* ── emit value ──────────────────────────────────────────── */
let lastEmittedKey = "";

function emitValue() {
  let payload = { start: null, end: null };

  if (
    startDateInput.value &&
    startTimeInput.value &&
    endDateInput.value &&
    endTimeInput.value
  ) {
    const sd = parseLocalDate(startDateInput.value);
    const ed = parseLocalDate(endDateInput.value);
    if (sd && ed) {
      const [sh, sm] = startTimeInput.value.split(":").map(Number);
      const [eh, em] = endTimeInput.value.split(":").map(Number);
      const start = new Date(
        sd.getFullYear(),
        sd.getMonth(),
        sd.getDate(),
        sh,
        sm || 0,
      );
      const end = new Date(
        ed.getFullYear(),
        ed.getMonth(),
        ed.getDate(),
        eh,
        em || 0,
      );
      if (end.getTime() > start.getTime()) {
        payload = { start: start.getTime(), end: end.getTime() };
      }
    }
  }

  const key = `${payload.start ?? ""}|${payload.end ?? ""}`;
  if (key === lastEmittedKey) return;
  lastEmittedKey = key;

  emit("update:modelValue", payload);
  emit("change", payload);
}

/* ── watch external modelValue ───────────────────────────── */
watch(
  () => props.modelValue,
  (v) => {
    if (!v || (!v.start && !v.end)) return;

    if (v.start) {
      const d = new Date(v.start);
      startDateInput.value = localISODate(d);
      startTimeInput.value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    if (v.end) {
      const d = new Date(v.end);
      endDateInput.value = localISODate(d);
      endTimeInput.value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }

    lastEmittedKey = `${v.start ?? ""}|${v.end ?? ""}`;
  },
  { immediate: true, deep: true },
);
</script>

<style scoped>
/* ════════════════════════════════════════════════════════════
   FullCalendar theme overrides
   ════════════════════════════════════════════════════════════ */

/* ── General ─────────────────────────────────────────────── */
:deep(.fc) {
  --fc-border-color: #e5e7eb;
  --fc-today-bg-color: rgba(99, 102, 241, 0.03);
  --fc-neutral-bg-color: transparent;
  --fc-page-bg-color: transparent;
  --fc-event-bg-color: transparent;
  --fc-event-border-color: transparent;
  font-family: inherit;
  font-size: 12px;
}

/* ── Compact slot rows ──────────────────────────────────── */
:deep(.fc-timegrid-slot) {
  height: 1.6em;
}

:is(.dark) :deep(.fc) {
  --fc-border-color: #374151;
  --fc-today-bg-color: rgba(99, 102, 241, 0.05);
  color: #e5e7eb;
}

/* Remove outer scrollgrid border (we have our own card border) */
:deep(.fc .fc-scrollgrid) {
  border: none;
}

:deep(.fc .fc-scrollgrid-section > td),
:deep(.fc .fc-scrollgrid-section > th) {
  border: none;
}

/* ── Column headers ──────────────────────────────────────── */
:deep(.fc-col-header-cell) {
  vertical-align: middle;
  padding: 0;
}

:deep(.fc-col-header-cell-cushion) {
  padding: 0;
  text-decoration: none !important;
}

:deep(.fc-day-header-inner) {
  text-align: center;
  padding: 5px 0;
}

:deep(.fc-day-header-weekday) {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #6b7280;
}

:deep(.fc-day-header-number) {
  margin-top: 1px;
  font-size: 0.95rem;
  font-weight: 800;
  line-height: 1;
  color: #1f2937;
}

:is(.dark) :deep(.fc-day-header-weekday) {
  color: #9ca3af;
}

:is(.dark) :deep(.fc-day-header-number) {
  color: #e5e7eb;
}

/* Today column header */
:deep(.fc-day-header--today .fc-day-header-weekday),
:deep(.fc-day-header--today .fc-day-header-number) {
  color: var(--color-primary, #6366f1);
}

/* ── Slot labels (time axis) ─────────────────────────────── */
:deep(.fc-timegrid-slot-label-cushion) {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
  padding: 0 4px;
}

:is(.dark) :deep(.fc-timegrid-slot-label-cushion) {
  color: #6b7280;
}

/* Minor (non-labelled) slot separator */
:deep(.fc-timegrid-slot-minor) {
  border-top-style: dashed;
  border-color: #f3f4f6;
}

:is(.dark) :deep(.fc-timegrid-slot-minor) {
  border-color: #1f2937;
}

/* ── Occupied background events (pink hatched) ───────────── */
:deep(.fc-bg-event.fc-occupied) {
  background: repeating-linear-gradient(
    -45deg,
    #e5e7eb,
    #e5e7eb 3px,
    #f3f4f6 3px,
    #f3f4f6 7px
  ) !important;
  opacity: 0.8 !important;
}

@media (prefers-color-scheme: dark) {
  :deep(.fc-bg-event.fc-occupied) {
    background: repeating-linear-gradient(
      -45deg,
      #4b5563,
      #4b5563 3px,
      #374151 3px,
      #374151 7px
    ) !important;
    opacity: 0.8 !important;
  }
}

/* ── User selection event ────────────────────────────────── */
:deep(.fc-event.fc-user-selection) {
  background-color: var(--color-primary, #6366f1) !important;
  opacity: 0.9;
  border-radius: 3px !important;
  box-shadow: none !important;
}

:is(.dark) :deep(.fc-event.fc-user-selection) {
  background-color: var(--color-primary, #6366f1) !important;
}

:deep(.fc-user-selection .fc-event-main) {
  padding: 0 !important;
}

:deep(.fc-user-selection .fc-event-time),
:deep(.fc-user-selection .fc-event-title) {
  display: none !important;
}

/* ── Selection highlight (while dragging) ────────────────── */
:deep(.fc-highlight) {
  background-color: rgba(99, 102, 241, 0.15) !important;
}

:is(.dark) :deep(.fc-highlight) {
  background-color: rgba(99, 102, 241, 0.2) !important;
}

/* ── Now-indicator line ──────────────────────────────────── */
:deep(.fc-timegrid-now-indicator-line) {
  border-color: #ef4444;
}

:deep(.fc-timegrid-now-indicator-arrow) {
  border-color: #ef4444;
}

/* ════════════════════════════════════════════════════════════
   Legend stripe (matches occupied pattern)
   ════════════════════════════════════════════════════════════ */
.occupied-legend {
  background: repeating-linear-gradient(
    -45deg,
    #e5e7eb,
    #e5e7eb 3px,
    #f3f4f6 3px,
    #f3f4f6 7px
  );
}

@media (prefers-color-scheme: dark) {
  .occupied-legend {
    background: repeating-linear-gradient(
      -45deg,
      #4b5563,
      #4b5563 3px,
      #374151 3px,
      #374151 7px
    );
  }
}
</style>
