<template>
  <div class="space-y-6">
    <p class="text-gray-500 dark:text-gray-400">
      {{ $t("weekSelection.subtitle") }}
    </p>

    <div class="flex items-center justify-between">
      <button
        type="button"
        :disabled="!canGoPreviousMonth"
        class="max-w-20 sm:max-w-none px-0 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:dark:hover:border-gray-700 transition-colors text-sm font-medium"
        @click="navigateMonth(-1)"
      >
        &larr; {{ $t("weekSelection.previousMonth") }}
      </button>

      <h3 class="flex items-center gap-2">
        <span class="text-xl font-bold text-gray-900 dark:text-white">{{
          currentMonthLabel
        }}</span>
        <DateJumper @select="onJumpDate" />
      </h3>

      <button
        type="button"
        class="max-w-20 sm:max-w-none px-0 sm:px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary transition-colors text-sm font-medium"
        @click="navigateMonth(1)"
      >
        <span class="sm:hidden">&rarr; <br /></span
        >{{ $t("weekSelection.nextMonth") }}
        <span class="hidden sm:inline">&rarr;</span>
      </button>
    </div>

    <!-- Week Cards Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <button
        v-for="week in weeksWithAvailability"
        :key="`${week.startMs}`"
        type="button"
        :disabled="!week.available"
        class="p-3 rounded-xl border-2 text-left transition-all focus:outline-none"
        :class="getWeekCardClass(week)"
        @click="selectWeek(week)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <span
              class="text-sm font-medium"
              :class="
                week.available
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-300 dark:text-gray-600'
              "
            >
              KW {{ week.weekNumber }}
            </span>
            <p
              class="text-lg font-bold mt-1"
              :class="
                week.available
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-300 dark:text-gray-600'
              "
            >
              {{ week.rangeLabel }}
            </p>
          </div>

          <div class="flex items-center gap-1.5">
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="
                week.available
                  ? 'bg-green-500'
                  : week.isPast
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-red-400'
              "
            />
            <span
              class="text-sm font-medium"
              :class="
                week.available
                  ? 'text-green-600 dark:text-green-400'
                  : week.isPast
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-red-400 dark:text-red-400'
              "
            >
              {{
                week.available
                  ? $t("weekSelection.available")
                  : week.isPast
                    ? $t("weekSelection.past")
                    : $t("weekSelection.occupied")
              }}
            </span>
          </div>
        </div>
      </button>
    </div>

    <p
      v-if="selectionLabel"
      class="text-sm text-gray-600 dark:text-gray-300 mt-4"
    >
      {{ $t("weekSelection.selected") }}:
      <span class="font-semibold text-gray-900 dark:text-white">
        {{ selectionLabel }}
      </span>
    </p>

    <!-- Loading indicator -->
    <div
      v-if="isLoadingAvailability"
      class="flex items-center justify-center py-4"
    >
      <UIcon name="i-lucide-loader-2" class="text-gray-400 animate-spin mr-2" />
      <span class="text-sm text-gray-500">{{ $t("common.loading") }}</span>
    </div>
  </div>
</template>

<script setup>
import { useBookables } from "~/composables/api/useBookables.js";
import DateJumper from "~/components/inputs/DateJumper.vue";

const props = defineProps({
  tenantId: { type: String, default: null },
  bookableId: { type: String, default: null },
  amount: { type: Number, default: 1 },
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  priceEur: { type: Number, default: null },
});

const emit = defineEmits(["update:modelValue", "change"]);

const { getBookableAvailability } = useBookables();

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTH_LABELS_FULL = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

const MONTH_LABELS_SHORT = [
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

// ── Helpers ────────────────────────────────────────────────────────────────────

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function getISOWeekNumber(date) {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function getMondayOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

function formatWeekRange(monday, sunday) {
  const startDay = pad2(monday.getDate());
  const endDay = pad2(sunday.getDate());
  const startMonth = MONTH_LABELS_SHORT[monday.getMonth()];
  const endMonth = MONTH_LABELS_SHORT[sunday.getMonth()];

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startDay}. – ${endDay}. ${endMonth}`;
  }
  return `${startDay}. ${startMonth} – ${endDay}. ${endMonth}`;
}

// ── Month navigation ───────────────────────────────────────────────────────────

const now = new Date();
const displayMonth = ref(now.getMonth());
const displayYear = ref(now.getFullYear());

const currentMonthLabel = computed(
  () => `${MONTH_LABELS_FULL[displayMonth.value]} ${displayYear.value}`,
);

const canGoPreviousMonth = computed(() => {
  const today = new Date();
  if (displayYear.value > today.getFullYear()) return true;
  return (
    displayYear.value === today.getFullYear() &&
    displayMonth.value > today.getMonth()
  );
});

function onJumpDate(date) {
  if (!date) return;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return;

  displayMonth.value = d.getMonth();
  displayYear.value = d.getFullYear();
}

function navigateMonth(delta) {
  let m = displayMonth.value + delta;
  let y = displayYear.value;
  while (m > 11) {
    m -= 12;
    y++;
  }
  while (m < 0) {
    m += 12;
    y--;
  }

  const today = new Date();
  if (
    y < today.getFullYear() ||
    (y === today.getFullYear() && m < today.getMonth())
  ) {
    return;
  }

  displayMonth.value = m;
  displayYear.value = y;
}

// ── Weeks for displayed month ──────────────────────────────────────────────────

const rawWeeks = computed(() => {
  const year = displayYear.value;
  const month = displayMonth.value;

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);

  const firstMonday = getMondayOfWeek(firstDayOfMonth);

  const weeks = [];
  const current = new Date(firstMonday);

  while (current <= lastDayOfMonth) {
    const monday = new Date(current);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(current);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    const weekNum = getISOWeekNumber(monday);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = sunday < today;

    weeks.push({
      weekNumber: weekNum,
      startDate: monday,
      endDate: sunday,
      startMs: monday.getTime(),
      endMs: sunday.getTime(),
      rangeLabel: formatWeekRange(monday, sunday),
      isPast,
    });

    current.setDate(current.getDate() + 7);
  }

  return weeks;
});

// ── Availability ───────────────────────────────────────────────────────────────

const availability = ref([]);
const isLoadingAvailability = ref(false);
const availabilityCache = new Map();

function buildCacheKey(tenantId, bookableId, startMs, endMs, amount) {
  return `${tenantId}|${bookableId}|${startMs}|${endMs}|${amount}`;
}

watch(
  () => [props.tenantId, props.bookableId, props.amount],
  () => {
    availabilityCache.clear();
  },
);

const visibleRange = computed(() => {
  const weeks = rawWeeks.value;
  if (!weeks.length) return null;
  return {
    startMs: weeks[0].startMs,
    endMs: weeks[weeks.length - 1].endMs,
  };
});

async function fetchAvailability() {
  const range = visibleRange.value;
  if (!props.tenantId || !props.bookableId || !range) {
    availability.value = [];
    return;
  }

  const cacheKey = buildCacheKey(
    props.tenantId,
    props.bookableId,
    range.startMs,
    range.endMs,
    props.amount,
  );

  if (availabilityCache.has(cacheKey)) {
    availability.value = availabilityCache.get(cacheKey);
    return;
  }

  isLoadingAvailability.value = true;
  try {
    const data = await getBookableAvailability({
      tenantID: props.tenantId,
      bookableId: props.bookableId,
      start: new Date(range.startMs).toISOString(),
      end: new Date(range.endMs).toISOString(),
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
  [
    () => props.tenantId,
    () => props.bookableId,
    () => props.amount,
    displayMonth,
    displayYear,
  ],
  () => {
    fetchAvailability();
  },
  { immediate: true },
);

function isWeekAvailable(week) {
  if (!availability.value.length) return true;

  for (const interval of availability.value) {
    if (interval.timeBegin < week.endMs && interval.timeEnd > week.startMs) {
      if (!interval.available) return false;
    }
  }
  return true;
}

// ── Combined weeks with availability ───────────────────────────────────────────

const weeksWithAvailability = computed(() => {
  return rawWeeks.value.map((week) => ({
    ...week,
    available: !week.isPast && isWeekAvailable(week),
    occupied: !week.isPast && !isWeekAvailable(week),
  }));
});

// ── Selection ──────────────────────────────────────────────────────────────────

const selectedWeekStartMs = ref(null);

const selectionLabel = computed(() => {
  const selected = weeksWithAvailability.value.find((w) => isSelectedWeek(w));
  return selected ? selected.rangeLabel : null;
});

function selectWeek(week) {
  if (!week.available) return;

  selectedWeekStartMs.value = week.startMs;

  const payload = { start: week.startMs, end: week.endMs };
  emit("update:modelValue", payload);
  emit("change", payload);
}

function isSelectedWeek(week) {
  return week.startMs === selectedWeekStartMs.value;
}

function getWeekCardClass(week) {
  if (!week.available) {
    return "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed opacity-70";
  }
  if (isSelectedWeek(week)) {
    return "border-primary dark:border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary dark:ring-primary cursor-pointer";
  }
  return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary dark:hover:border-primary cursor-pointer";
}

// ── Sync with modelValue prop ──────────────────────────────────────────────────

watch(
  () => props.modelValue,
  (v) => {
    if (!v || (!v.start && !v.end)) {
      selectedWeekStartMs.value = null;
      return;
    }
    if (v.start) {
      const monday = getMondayOfWeek(new Date(v.start));
      selectedWeekStartMs.value = monday.getTime();
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped></style>
