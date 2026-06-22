<template>
  <div :class="compact ? 'space-y-2' : 'space-y-8'">
    <section>
      <div :class="compact ? 'flex items-center gap-1.5 mb-1.5' : 'flex items-center gap-2 mb-4'">
        <h3
          :class="[
            'font-bold text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-1.5',
            compact ? 'text-[10px]' : 'text-xs',
          ]"
        >
          <UIcon name="i-lucide-calendar-days" :class="compact ? 'text-sm' : 'text-base'" />
          {{ $t("timePeriods.selectDate") }}
          <UIcon
            v-if="isLoadingAvailability"
            name="i-lucide-loader-2"
            class="text-base animate-spin ml-1 text-gray-400"
          />
        </h3>

        <DateJumper @select="onJumpDateSelected" />

        <button
          v-if="!compact"
          type="button"
          :disabled="isSearchingNextFreeDay"
          class="w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-primary dark:hover:border-primary hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          :aria-label="$t('timePeriods.jumpToNextFree')"
          :title="$t('timePeriods.jumpToNextFree')"
          @click="jumpToNextFreeDay"
        >
          <UIcon
            :name="isSearchingNextFreeDay
              ? 'i-lucide-loader-2'
              : 'i-lucide-fast-forward'"
            class="text-sm"
            :class="isSearchingNextFreeDay ? 'animate-spin' : ''"
          />
        </button>
      </div>

      <div class="@container flex items-center gap-2">
        <button
          type="button"
          :disabled="!canGoBack"
          :class="compact ? 'shrink-0 w-7 h-7' : 'shrink-0 w-9 h-9'"
          class="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary dark:hover:border-primary hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:dark:hover:border-gray-700 transition-colors"
          :aria-label="$t('timePeriods.previousDays')"
          @click="navigateDays(-effectiveNumDays)"
        >
          <UIcon name="i-lucide-chevron-left" />
        </button>

        <div
          class="flex-1 grid gap-1.5"
          :class="compact ? 'grid-cols-4 gap-1' : 'grid-cols-4 @md:grid-cols-7 gap-2'"
        >
          <button
            v-for="day in displayDays"
            :key="day.iso"
            type="button"
            :disabled="!day.hasAvailability"
            :class="[
              compact
                ? 'flex flex-col items-center justify-center py-1 px-0.5 border rounded-md transition-all focus:outline-none relative'
                : 'flex flex-col items-center justify-center py-3 px-2 border rounded-xl transition-all focus:outline-none relative',
              getDayClass(day),
            ]"
            :title="getDayTitle(day)"
            @click="selectDay(day)"
          >
            <span
              class="text-[10px] font-semibold tracking-wider"
              :class="getDayWeekdayClass(day)"
            >
              {{ day.weekdayLabel }}
            </span>
            <span
              :class="[
                compact ? 'text-base' : 'text-2xl',
                'font-extrabold leading-none my-0.5 tabular-nums',
                getDayNumberClass(day),
              ]"
            >
              {{ day.dayNumber }}
            </span>
            <span
              class="text-[10px]"
              :class="getDayWeekdayClass(day)"
            >
              {{ day.monthLabel }}
            </span>

            <span
              v-if="day.hasMatchingPeriod && !day.hasAvailability"
              class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 flex items-center justify-center"
              :aria-label="$t('timePeriods.fullyBooked')"
            >
              <UIcon name="i-lucide-x" class="text-[9px]" />
            </span>
          </button>
        </div>

        <button
          type="button"
          :class="compact ? 'shrink-0 w-7 h-7' : 'shrink-0 w-9 h-9'"
          class="flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
          :aria-label="$t('timePeriods.laterDays')"
          @click="navigateDays(effectiveNumDays)"
        >
          <UIcon name="i-lucide-chevron-right" />
        </button>
      </div>

      <div
        v-if="!compact"
        class="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-[11px] text-gray-500 dark:text-gray-400"
      >
        <span class="flex items-center gap-1.5">
          <span class="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
          {{ $t("timePeriods.legendAvailable") }}
        </span>
        <span class="flex items-center gap-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full bg-red-400 dark:bg-red-500 inline-block"
          />
          {{ $t("timePeriods.legendFullyBooked") }}
        </span>
        <span class="flex items-center gap-1.5">
          <span
            class="w-2.5 h-2.5 rounded-full bg-gray-300 dark:bg-gray-600 inline-block"
          />
          {{ $t("timePeriods.legendClosed") }}
        </span>
      </div>
    </section>

    <!-- timetable -->
    <section>
      <h3
        :class="[
          'text-xs font-bold text-gray-400 dark:text-gray-500 tracking-widest flex items-center gap-2',
          compact ? 'mb-1.5' : 'mb-4',
        ]"
      >
        <UIcon name="i-lucide-clock" class="text-base" />
        {{ $t("timePeriods.selectTime") }}
        <UIcon
          v-if="isLoadingAvailability"
          name="i-lucide-loader-2"
          class="text-base animate-spin ml-1 text-gray-400"
        />
      </h3>

      <div
        v-if="displayHourSlots.length > 0"
        :class="
          compact
            ? 'grid grid-cols-4 gap-1'
            : 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3'
        "
      >
        <button
          v-for="slot in displayHourSlots"
          :key="slot.hour"
          type="button"
          :disabled="!slot.available"
          :class="[
            compact
              ? 'px-1.5 py-1.5 rounded-md border text-center text-xs font-medium tabular-nums transition-all focus:outline-none'
              : 'px-4 py-3 rounded-lg border text-center font-medium tabular-nums transition-all focus:outline-none',
            getSlotClass(slot),
          ]"
          @click="onSlotClick(slot)"
        >
          <span :class="!slot.available ? 'line-through' : ''">
            {{ slot.label }}
          </span>
        </button>
      </div>

      <p v-else class="text-sm text-gray-500 dark:text-gray-400">
        {{ $t("timePeriods.noTimePeriods") }}
      </p>

      <p
        v-if="!compact && selectionLabel"
        class="text-sm text-gray-600 dark:text-gray-300 mt-4"
      >
        {{ $t("timePeriods.selected") }}:
        <span class="font-semibold text-gray-900 dark:text-white">
          {{ selectionLabel }}
        </span>
      </p>
    </section>
  </div>
</template>

<script setup>
import { useBookables } from "~/composables/api/useBookables.js";
import DateJumper from "~/components/inputs/DateJumper.vue";


const props = defineProps({
  timePeriods: {
    type: Array,
    default: () => [],
  },
  tenantId: {
    type: String,
    default: null,
  },
  bookableId: {
    type: String,
    default: null,
  },
  numDays: {
    type: Number,
    default: 7,
  },
  amount: {
    type: Number,
    default: 1,
  },
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  compact: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["update:modelValue", "change"]);

const effectiveNumDays = computed(() =>
  props.compact ? 4 : props.numDays,
);

const { getBookableAvailability } = useBookables();
const { t } = useI18n();

const WEEKDAY_LABELS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mär",
  "Apr",
  "Mai",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Okt",
  "Nov",
  "Dez",
];

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function timeToHours(timeStr) {
  if (!timeStr || typeof timeStr !== "string") return null;
  const [h, m] = timeStr.split(":").map(Number);
  if (Number.isNaN(h)) return null;
  return h + (Number.isNaN(m) ? 0 : m / 60);
}

function localISODate(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate()
  )}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

const dayOffset = ref(0);

const canGoBack = computed(() => dayOffset.value > 0);

function navigateDays(delta) {
  const next = dayOffset.value + delta;
  dayOffset.value = Math.max(0, next);
}

function syncDayOffsetToDate(date) {
  if (!date) return;

  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);

  const today = startOfToday();
  const diffDays = Math.round((selected - today) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return;

  dayOffset.value = diffDays;
}

function onJumpDateSelected(date) {
  if (!date) return;

  syncDayOffsetToDate(date);
  const selected = new Date(date);
  selected.setHours(0, 0, 0, 0);
  selectedDayIso.value = localISODate(selected);
  startHour.value = null;
  endHour.value = null;
  emitValue();
}

const isSearchingNextFreeDay = ref(false);
const MAX_NEXT_FREE_LOOKAHEAD_DAYS = 365;

async function fetchAvailabilityBlock(blockBase) {
  const blockEnd = new Date(blockBase);
  blockEnd.setDate(blockEnd.getDate() + effectiveNumDays.value);
  blockEnd.setMilliseconds(blockEnd.getMilliseconds() - 1);

  const cacheKey = buildCacheKey(
    props.tenantId,
    props.bookableId,
    blockBase.getTime(),
    blockEnd.getTime(),
    props.amount
  );

  if (availabilityCache.has(cacheKey)) {
    return availabilityCache.get(cacheKey);
  }

  try {
    const res = await getBookableAvailability({
      tenantID: props.tenantId,
      bookableId: props.bookableId,
      start: blockBase.toISOString(),
      end: blockEnd.toISOString(),
      amount: props.amount,
    });
    const data = Array.isArray(res?.availability) ? res.availability : [];
    availabilityCache.set(cacheKey, data);
    return data;
  } catch {
    return [];
  }
}

async function jumpToNextFreeDay() {
  if (isSearchingNextFreeDay.value) return;
  if (!props.tenantId || !props.bookableId) return;

  isSearchingNextFreeDay.value = true;
  try {
    const today = startOfToday();

    let startOffset = dayOffset.value;
    if (selectedDayIso.value) {
      const [y, m, d] = selectedDayIso.value.split("-").map(Number);
      const sel = new Date(y, m - 1, d);
      const diff = Math.round((sel - today) / 86_400_000);
      startOffset = Math.max(diff + 1, 0);
    }

    for (
      let blockStart = startOffset;
      blockStart < startOffset + MAX_NEXT_FREE_LOOKAHEAD_DAYS;
      blockStart += effectiveNumDays.value
    ) {
      const blockBase = new Date(today);
      blockBase.setDate(today.getDate() + blockStart);

      const availData = await fetchAvailabilityBlock(blockBase);

      for (let i = 0; i < effectiveNumDays.value; i++) {
        const d = new Date(blockBase);
        d.setDate(blockBase.getDate() + i);
        const weekday = d.getDay();
        const matchingPeriods = (props.timePeriods || []).filter(
          (p) => Array.isArray(p.weekdays) && p.weekdays.includes(weekday)
        );
        if (!matchingPeriods.length) continue;

        if (dayHasAnyFreeSlot(d, matchingPeriods, availData)) {
          dayOffset.value = blockStart;
          selectedDayIso.value = localISODate(d);
          startHour.value = null;
          endHour.value = null;
          emitValue();
          return;
        }
      }
    }
  } finally {
    isSearchingNextFreeDay.value = false;
  }
}

const windowRange = computed(() => {
  const start = startOfToday();
  start.setDate(start.getDate() + dayOffset.value);

  const end = new Date(start);
  end.setDate(end.getDate() + effectiveNumDays.value);
  end.setMilliseconds(end.getMilliseconds() - 1);

  return { startMs: start.getTime(), endMs: end.getTime() };
});

const availability = ref([]);
const isLoadingAvailability = ref(false);

const availabilityCache = new Map();

function buildCacheKey(tenantId, bookableId, startMs, endMs, amount) {
  return `${tenantId}|${bookableId}|${startMs}|${endMs}|${amount}`;
}

function clearAvailabilityCache() {
  availabilityCache.clear();
}

async function fetchAvailabilityForWindow() {
  if (!props.tenantId || !props.bookableId) {
    availability.value = [];
    return;
  }

  const { startMs, endMs } = windowRange.value;
  const cacheKey = buildCacheKey(
    props.tenantId,
    props.bookableId,
    startMs,
    endMs,
    props.amount
  );

  if (availabilityCache.has(cacheKey)) {
    availability.value = availabilityCache.get(cacheKey);
    return;
  }

  const start = new Date(startMs);
  const end = new Date(endMs);

  isLoadingAvailability.value = true;
  try {
    const data = await getBookableAvailability({
      tenantID: props.tenantId,
      bookableId: props.bookableId,
      start: start.toISOString(),
      end: end.toISOString(),
      amount: props.amount,
    });

    const result = Array.isArray(data?.availability) ? data.availability : [];

    availabilityCache.set(cacheKey, result);
    availability.value = result;
  } catch {
    availability.value = [];
  } finally {
    isLoadingAvailability.value = false;
  }
}

watch(
  () => [props.tenantId, props.bookableId, props.amount],
  () => {
    clearAvailabilityCache();
  }
);

watch(
  () => [props.tenantId, props.bookableId, dayOffset.value, props.amount],
  () => {
    fetchAvailabilityForWindow();
  },
  { immediate: true }
);

const days = computed(() => {
  const list = [];
  const base = startOfToday();
  base.setDate(base.getDate() + dayOffset.value);

  for (let i = 0; i < effectiveNumDays.value; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);

    const weekday = d.getDay();
    const matchingPeriods = (props.timePeriods || []).filter(
      (p) => Array.isArray(p.weekdays) && p.weekdays.includes(weekday)
    );

    const hasMatchingPeriod = matchingPeriods.length > 0;
    const hasFreeSlots =
      hasMatchingPeriod && dayHasAnyFreeSlot(d, matchingPeriods);

    list.push({
      date: d,
      iso: localISODate(d),
      weekday,
      weekdayLabel: WEEKDAY_LABELS[weekday],
      dayNumber: d.getDate(),
      monthLabel: MONTH_LABELS[d.getMonth()],
      hasMatchingPeriod,
      hasAvailability: hasFreeSlots,
    });
  }
  return list;
});

const displayDays = computed(() => {
  if (!props.compact) return days.value;
  return days.value.filter((day) => day.hasAvailability);
});

const selectedDayIso = ref(null);

const selectedDay = computed(() => {
  if (!selectedDayIso.value) return null;

  const fromWindow = days.value.find((d) => d.iso === selectedDayIso.value);
  if (fromWindow) return fromWindow;

  const [y, m, d] = selectedDayIso.value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return {
    date,
    iso: selectedDayIso.value,
    weekday: date.getDay(),
    weekdayLabel: WEEKDAY_LABELS[date.getDay()],
    dayNumber: date.getDate(),
    monthLabel: MONTH_LABELS[date.getMonth()],
    hasMatchingPeriod: true,
    hasAvailability: true,
  };
});

function isSelectedDay(day) {
  return day.iso === selectedDayIso.value;
}

function selectDay(day) {
  if (!day.hasAvailability) return;
  if (day.iso === selectedDayIso.value) return;

  selectedDayIso.value = day.iso;
  startHour.value = null;
  endHour.value = null;
  emitValue();
}

watch(
  days,
  (list) => {
    if (selectedDayIso.value) {
      return;
    }
    const first = list.find((d) => d.hasAvailability);
    if (first) selectedDayIso.value = first.iso;
  },
  { immediate: true }
);

const dayPeriods = computed(() => {
  const day = selectedDay.value;
  if (!day) return [];
  return (props.timePeriods || []).filter(
    (p) => Array.isArray(p.weekdays) && p.weekdays.includes(day.weekday)
  );
});

const hourSlots = computed(() => {
  const day = selectedDay.value;
  if (!day) return [];

  const hours = new Set();
  for (const p of dayPeriods.value) {
    const ps = timeToHours(p.startTime);
    const pe = timeToHours(p.endTime);
    if (ps == null || pe == null) continue;

    const startH = Math.max(0, Math.floor(ps));
    const endH = Math.min(24, Math.ceil(pe));

    for (let h = startH; h < endH; h++) {
      if (h >= ps && h + 1 <= pe) {
        hours.add(h);
      }
    }
  }

  return Array.from(hours)
    .sort((a, b) => a - b)
    .map((h) => ({
      hour: h,
      label: `${pad2(h)}:00`,
      available: isHourSlotAvailable(day.date, h),
    }));
});

const displayHourSlots = computed(() => {
  if (!props.compact) return hourSlots.value;
  return hourSlots.value.filter((slot) => slot.available);
});

function slotTimestamps(date, hour) {
  const start = new Date(date);
  start.setHours(hour, 0, 0, 0);
  const end = new Date(date);
  end.setHours(hour + 1, 0, 0, 0);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

function isHourSlotAvailable(date, hour, availData = availability.value) {
  if (!availData.length) return true;

  const { startMs, endMs } = slotTimestamps(date, hour);

  for (const interval of availData) {
    if (interval.timeBegin < endMs && interval.timeEnd > startMs) {
      if (!interval.available) return false;
    }
  }
  return true;
}

function dayHasAnyFreeSlot(date, matchingPeriods, availData = availability.value) {
  if (!availData.length) return true;

  for (const p of matchingPeriods) {
    const ps = timeToHours(p.startTime);
    const pe = timeToHours(p.endTime);
    if (ps == null || pe == null) continue;
    const startH = Math.max(0, Math.floor(ps));
    const endH = Math.min(24, Math.ceil(pe));

    for (let h = startH; h < endH; h++) {
      if (h >= ps && h + 1 <= pe) {
        if (isHourSlotAvailable(date, h, availData)) return true;
      }
    }
  }
  return false;
}

function getDayClass(day) {
  if (isSelectedDay(day)) {
    return "border-primary dark:border-primary bg-primary/10 ring-1 ring-primary dark:ring-primary cursor-pointer";
  }
  if (!day.hasAvailability) {
    if (day.hasMatchingPeriod) {
      return "border-dashed border-red-200 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20 cursor-not-allowed";
    }
    return "border-dashed border-gray-200 dark:border-gray-800 opacity-50 cursor-not-allowed";
  }
  return "border-gray-200 dark:border-gray-700 hover:border-primary dark:hover:border-primary cursor-pointer";
}

function getDayNumberClass(day) {
  if (isSelectedDay(day)) {
    return "text-primary dark:text-primary";
  }
  if (!day.hasAvailability) {
    if (day.hasMatchingPeriod) {
      return "text-red-400 dark:text-red-500 line-through decoration-2";
    }
    return "text-gray-400 dark:text-gray-500";
  }
  return "text-gray-900 dark:text-white";
}

function getDayWeekdayClass(day) {
  if (isSelectedDay(day)) {
    return "text-primary/80 dark:text-primary/80";
  }
  if (!day.hasAvailability) {
    return "text-gray-400 dark:text-gray-500";
  }
  return "text-gray-500 dark:text-gray-400";
}

function getDayTitle(day) {
  if (day.hasAvailability) return "";
  if (day.hasMatchingPeriod) return t("timePeriods.fullyBooked");
  return t("timePeriods.closedDay");
}

const startHour = ref(null);
const endHour = ref(null);

function isSlotSelected(slot) {
  if (startHour.value == null) return false;
  if (endHour.value == null) return slot.hour === startHour.value;
  return slot.hour >= startHour.value && slot.hour < endHour.value;
}

function getSlotClass(slot) {
  if (!slot.available) {
    return "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 text-gray-300 dark:text-gray-600 cursor-not-allowed";
  }
  if (isSlotSelected(slot)) {
    return "border-primary dark:border-primary bg-primary/10 dark:bg-primary text-primary shadow-sm cursor-pointer ring-1 ring-primary dark:ring-primary";
  }
  return "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary cursor-pointer";
}

function rangeIsContiguouslyAvailable(fromHour, toHourExclusive) {
  for (let h = fromHour; h < toHourExclusive; h++) {
    const slot = hourSlots.value.find((s) => s.hour === h);
    if (!slot || !slot.available) return false;
  }
  return true;
}

function onSlotClick(slot) {
  if (!slot.available) return;

  if (startHour.value == null) {
    startHour.value = slot.hour;
    endHour.value = null;
    emitValue();
    return;
  }

  if (endHour.value == null) {
    if (slot.hour === startHour.value) {
      startHour.value = null;
      endHour.value = null;
      emitValue();
      return;
    }

    const lo = Math.min(startHour.value, slot.hour);
    const hiExclusive = Math.max(startHour.value, slot.hour) + 1;

    if (rangeIsContiguouslyAvailable(lo, hiExclusive)) {
      startHour.value = lo;
      endHour.value = hiExclusive;
      emitValue();
      return;
    }

    startHour.value = slot.hour;
    endHour.value = null;
    emitValue();
    return;
  }

  startHour.value = slot.hour;
  endHour.value = null;
  emitValue();
}

watch(availability, () => {
  if (startHour.value != null && endHour.value != null) {
    if (!rangeIsContiguouslyAvailable(startHour.value, endHour.value)) {
      startHour.value = null;
      endHour.value = null;
      emitValue();
    }
  } else if (startHour.value != null) {
    const slot = hourSlots.value.find((s) => s.hour === startHour.value);
    if (!slot || !slot.available) {
      startHour.value = null;
      emitValue();
    }
  }
});

const selectionLabel = computed(() => {
  if (!selectedDay.value || startHour.value == null) return "";

  const date = selectedDay.value.date;
  const dateStr = date.toLocaleDateString("de-DE", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const startStr = `${pad2(startHour.value)}:00`;
  const endStr = `${pad2(endHour.value ?? startHour.value + 1)}:00`;

  return `${dateStr}, ${startStr} – ${endStr}`;
});

let lastEmittedKey = "";

function emitValue() {
  const day = selectedDay.value;
  let payload = { start: null, end: null };

  if (day && startHour.value != null) {
    const start = new Date(day.date);
    start.setHours(startHour.value, 0, 0, 0);

    const endH = endHour.value ?? startHour.value + 1;
    const end = new Date(day.date);
    end.setHours(endH, 0, 0, 0);

    payload = { start: start.getTime(), end: end.getTime() };
  }

  const key = `${payload.start ?? ""}|${payload.end ?? ""}`;
  if (key === lastEmittedKey) return;
  lastEmittedKey = key;

  emit("update:modelValue", payload);
  emit("change", payload);
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v || (!v.start && !v.end)) return;

    if (v.start) {
      const d = new Date(v.start);
      syncDayOffsetToDate(d);
      selectedDayIso.value = localISODate(d);
      startHour.value = d.getHours();
      endHour.value = null;
    }
    if (v.end) {
      const d = new Date(v.end);
      endHour.value = d.getHours();
    }

    lastEmittedKey = `${v.start ?? ""}|${v.end ?? ""}`;
  },
  { immediate: true, deep: true }
);
</script>

<style scoped></style>
