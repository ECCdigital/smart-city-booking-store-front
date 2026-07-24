<template>
  <div :class="compact ? '@container space-y-2' : '@container space-y-6'">
    <p v-if="!compact" class="text-gray-500 dark:text-gray-400">
      {{ $t("monthSelection.subtitle") }}
    </p>

    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        :disabled="!canGoPreviousYear"
        :class="navButtonClass"
        @click="navigateYear(-1)"
      >
        <UIcon name="i-lucide-chevron-left" :size="compact ? 16 : 14" />
        <span v-if="!compact" class="hidden sm:block">
          {{ $t("monthSelection.previousYear") }}
        </span>
      </button>

      <h3 class="flex items-center gap-2 min-w-0">
        <span
          :class="
            compact
              ? 'text-sm font-semibold text-gray-900 dark:text-white'
              : 'text-xl font-bold text-gray-900 dark:text-white'
          "
        >
          {{ displayYear }}
        </span>
        <DateJumper @select="onJumpDate" />
      </h3>

      <button type="button" :class="navButtonClass" @click="navigateYear(1)">
        <UIcon
          name="i-lucide-chevron-right"
          :size="compact ? 16 : 14"
          :class="compact ? '' : 'order-1 sm:order-2'"
        />
        <span v-if="!compact" class="hidden sm:block sm:order-1">{{
          $t("monthSelection.nextYear")
        }}</span>
      </button>
    </div>

    <!-- Month Cards Grid -->
    <div
      :class="
        compact
          ? 'grid grid-cols-3 gap-1.5'
          : 'grid grid-cols-2 @3xl:grid-cols-3 gap-4'
      "
    >
      <button
        v-for="month in displayMonths"
        :key="month.startMs"
        type="button"
        :disabled="!month.available"
        :class="[
          compact
            ? 'px-2 py-1.5 rounded-md border text-center transition-all focus:outline-none'
            : 'p-3 rounded-xl border-2 text-left transition-all focus:outline-none',
          getMonthCardClass(month),
        ]"
        @click="selectMonth(month)"
      >
        <p
          v-if="compact"
          class="text-sm font-semibold truncate"
          :class="
            month.available
              ? 'text-gray-900 dark:text-white'
              : 'text-gray-300 dark:text-gray-600'
          "
        >
          {{ month.label }}
        </p>
        <div v-else class="grid sm:flex items-start sm:justify-between gap-3">
          <div class="min-w-0 order-2 sm:order-1">
            <span
              class="text-sm font-medium"
              :class="
                month.available
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-300 dark:text-gray-600'
              "
            >
              {{ month.rangeLabel }}
            </span>
            <p
              class="text-lg font-bold mt-1"
              :class="
                month.available
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-300 dark:text-gray-600'
              "
            >
              {{ month.label }}
            </p>
          </div>

          <div
            class="flex items-center justify-end sm:justify-around gap-1.5 order-1 sm:order-2"
          >
            <span
              class="w-2.5 h-2.5 rounded-full shrink-0"
              :class="
                month.available
                  ? 'bg-green-500'
                  : month.isPast
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-red-400'
              "
            />
            <span
              class="text-sm font-medium"
              :class="
                month.available
                  ? 'text-green-600 dark:text-green-400'
                  : month.isPast
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-red-400 dark:text-red-400'
              "
            >
              {{
                month.available
                  ? $t("monthSelection.available")
                  : month.isPast
                    ? $t("monthSelection.past")
                    : $t("monthSelection.occupied")
              }}
            </span>
          </div>
        </div>
      </button>
    </div>

    <p
      v-if="!compact && selectionLabel"
      class="text-sm text-gray-600 dark:text-gray-300 mt-4"
    >
      {{ $t("monthSelection.selected") }}:
      <span class="font-semibold text-gray-900 dark:text-white">
        {{ selectionLabel }}
      </span>
    </p>

    <!-- Loading indicator -->
    <div
      v-if="isLoadingAvailability"
      :class="
        compact
          ? 'flex items-center justify-center py-2'
          : 'flex items-center justify-center py-4'
      "
    >
      <UIcon name="i-lucide-loader-2" class="text-gray-400 animate-spin mr-2" />
      <span class="text-sm text-gray-500">{{ $t("common.loading") }}</span>
    </div>
  </div>
</template>

<script setup>
import { useBookables } from "../../composables/api/useBookables.js";
import DateJumper from "../inputs/DateJumper.vue";

const props = defineProps({
  tenantId: { type: String, default: null },
  bookableId: { type: String, default: null },
  amount: { type: Number, default: 1 },
  modelValue: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  priceEur: { type: Number, default: null },
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);

const navButtonClass = computed(() =>
  props.compact
    ? "shrink-0 w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary dark:hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    : "flex items-center max-w-25 sm:max-w-none px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:dark:hover:border-gray-700 transition-colors text-sm font-medium",
);

const { getBookableAvailability } = useBookables();

// -- Constants ----------------------------------------------------------------

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

// -- Helpers ------------------------------------------------------------------

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function formatMonthRange(firstDay, lastDay) {
  const startDay = pad2(firstDay.getDate());
  const endDay = pad2(lastDay.getDate());
  const monthLabel = MONTH_LABELS_SHORT[firstDay.getMonth()];
  return `${startDay}. – ${endDay}. ${monthLabel} ${firstDay.getFullYear()}`;
}

// -- Year navigation ----------------------------------------------------------

const now = new Date();
const displayYear = ref(now.getFullYear());

const canGoPreviousYear = computed(() => {
  return displayYear.value > new Date().getFullYear();
});

function onJumpDate(date) {
  if (!date) return;
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return;

  displayYear.value = d.getFullYear();
}

function navigateYear(delta) {
  const newYear = displayYear.value + delta;
  if (newYear < new Date().getFullYear()) return;
  displayYear.value = newYear;
}

// -- Months for displayed year ------------------------------------------------

const rawMonths = computed(() => {
  const year = displayYear.value;
  const months = [];

  for (let m = 0; m < 12; m++) {
    const firstDay = new Date(year, m, 1);
    firstDay.setHours(0, 0, 0, 0);

    const lastDay = new Date(year, m + 1, 0);
    lastDay.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isPast = lastDay < today;

    months.push({
      monthIndex: m,
      year,
      label: MONTH_LABELS_FULL[m],
      rangeLabel: formatMonthRange(firstDay, lastDay),
      startDate: firstDay,
      endDate: lastDay,
      startMs: firstDay.getTime(),
      endMs: lastDay.getTime(),
      isPast,
    });
  }

  return months;
});

// -- Availability -------------------------------------------------------------

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
  const months = rawMonths.value;
  if (!months.length) return null;
  return {
    startMs: months[0].startMs,
    endMs: months[months.length - 1].endMs,
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
    displayYear,
  ],
  () => {
    fetchAvailability();
  },
  { immediate: true },
);

function isMonthAvailable(month) {
  if (!availability.value.length) return true;

  for (const interval of availability.value) {
    if (interval.timeBegin < month.endMs && interval.timeEnd > month.startMs) {
      if (!interval.available) return false;
    }
  }
  return true;
}

// -- Combined months with availability ----------------------------------------

const monthsWithAvailability = computed(() => {
  return rawMonths.value.map((month) => ({
    ...month,
    available: !month.isPast && isMonthAvailable(month),
    occupied: !month.isPast && !isMonthAvailable(month),
  }));
});

const displayMonths = computed(() => {
  if (!props.compact) return monthsWithAvailability.value;
  return monthsWithAvailability.value.filter((month) => month.available);
});

// -- Selection ----------------------------------------------------------------

const selectedMonthKey = ref(null);

function makeMonthKey(month) {
  return `${month.year}-${month.monthIndex}`;
}

const selectionLabel = computed(() => {
  const selected = monthsWithAvailability.value.find((m) => isSelectedMonth(m));
  if (!selected) return null;
  return `${selected.label} ${selected.year}`;
});

function selectMonth(month) {
  if (!month.available) return;

  selectedMonthKey.value = makeMonthKey(month);

  const payload = { start: month.startMs, end: month.endMs };
  emit("update:modelValue", payload);
  emit("change", payload);
}

function isSelectedMonth(month) {
  return makeMonthKey(month) === selectedMonthKey.value;
}

function getMonthCardClass(month) {
  if (!month.available) {
    return "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed opacity-70";
  }
  if (isSelectedMonth(month)) {
    return "border-primary dark:border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary dark:ring-primary cursor-pointer";
  }
  return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary dark:hover:border-primary cursor-pointer";
}

// -- Sync with modelValue prop ------------------------------------------------

watch(
  () => props.modelValue,
  (v) => {
    if (!v || (!v.start && !v.end)) {
      selectedMonthKey.value = null;
      return;
    }
    if (v.start) {
      const d = new Date(v.start);
      selectedMonthKey.value = `${d.getFullYear()}-${d.getMonth()}`;
      onJumpDate(d);
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped></style>
