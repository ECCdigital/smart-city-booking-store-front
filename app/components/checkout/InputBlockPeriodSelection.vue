<template>
  <div :class="compact ? 'space-y-2' : 'space-y-6'">
    <p v-if="!compact" class="text-gray-500 dark:text-gray-400">
      {{ $t("bookingTimeWindowSelection.subtitle") }}
    </p>

    <div class="flex items-center justify-between gap-2">
      <button
        type="button"
        :disabled="!canGoPreviousMonth"
        :class="navButtonClass"
        @click="navigateMonth(-1)"
      >
        <UIcon name="i-lucide-chevron-left" :size="compact ? 16 : 14" />
        <span v-if="!compact" class="hidden sm:block">
          {{ $t("bookingTimeWindowSelection.previousMonth") }}
        </span>
      </button>

      <h3 class="flex items-center gap-2 min-w-0">
        <span
          :class="
            compact
              ? 'text-xs font-semibold text-gray-900 dark:text-white'
              : 'text-xl font-bold text-gray-900 dark:text-white'
          "
        >
          {{ currentMonthLabel }}
        </span>
        <DateJumper @select="onJumpDate" />
      </h3>

      <button
        type="button"
        :class="navButtonClass"
        @click="navigateMonth(1)"
      >
        <UIcon
          name="i-lucide-chevron-right"
          :size="compact ? 16 : 14"
          :class="compact ? '' : 'order-1 sm:order-2'"
        />
        <span v-if="!compact" class="hidden sm:block sm:order-1">
          {{ $t("bookingTimeWindowSelection.nextMonth") }}
        </span>
      </button>
    </div>

    <p
      v-if="!isLoading && displayBlockPeriodCards.length === 0"
      class="text-xs text-gray-500 dark:text-gray-400 py-1 text-center"
    >
      {{ $t("bookingTimeWindowSelection.empty") }}
    </p>

    <div
      v-else
      :class="compact ? 'grid grid-cols-2 gap-1.5' : 'grid grid-cols-1 md:grid-cols-2 gap-4'"
    >
      <button
        v-for="block in displayBlockPeriodCards"
        :key="block.key"
        type="button"
        :disabled="!block.selectable"
        :class="[
          compact
            ? 'px-2 py-1.5 rounded-md border text-left transition-all focus:outline-none'
            : 'p-3 rounded-xl border-2 text-left transition-all focus:outline-none',
          getBlockCardClass(block),
        ]"
        @click="selectBlock(block)"
      >
        <div
          v-if="compact"
          class="flex items-center justify-between gap-2 min-w-0"
        >
          <p class="text-xs font-semibold text-gray-900 dark:text-white truncate leading-tight">
            <span class="text-gray-500 font-medium">{{ block.label }}</span>
            · {{ block.rangeLabel }}
          </p>
          <span
            v-if="block.priceEur != null"
            class="text-xs font-bold shrink-0 tabular-nums text-gray-900 dark:text-white"
          >
            {{ formatEur(block.priceEur) }}
          </span>
        </div>
        <div v-else class="flex items-start justify-between gap-2">
          <div class="min-w-0">
            <span
              :class="[
                compact ? 'text-xs' : 'text-sm',
                'font-medium',
                block.selectable
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-300 dark:text-gray-600',
              ]"
            >
              {{ block.label }}
            </span>
            <p
              :class="[
                compact ? 'text-sm' : 'text-lg',
                'font-bold mt-0.5',
                block.selectable
                  ? 'text-gray-900 dark:text-white'
                  : 'text-gray-300 dark:text-gray-600',
              ]"
            >
              {{ block.rangeLabel }}
            </p>
            <p
              v-if="!compact"
              class="text-sm mt-0.5 tabular-nums"
              :class="
                block.selectable
                  ? 'text-gray-500 dark:text-gray-400'
                  : 'text-gray-300 dark:text-gray-600'
              "
            >
              {{ block.timeLabel }}
            </p>
            <p
              v-if="block.selectable && block.priceEur != null"
              :class="[
                compact ? 'text-xs' : 'text-sm',
                'font-semibold mt-0.5 text-gray-900 dark:text-white tabular-nums',
              ]"
            >
              {{ formatEur(block.priceEur) }}
            </p>
          </div>

          <div class="flex items-center gap-1 shrink-0">
            <span
              class="w-2 h-2 rounded-full shrink-0"
              :class="
                block.selectable
                  ? 'bg-green-500'
                  : block.isPast
                    ? 'bg-gray-300 dark:bg-gray-600'
                    : 'bg-red-400'
              "
            />
            <span
              v-if="!compact"
              class="text-sm font-medium"
              :class="
                block.selectable
                  ? 'text-green-600 dark:text-green-400'
                  : block.isPast
                    ? 'text-gray-400 dark:text-gray-500'
                    : 'text-red-400 dark:text-red-400'
              "
            >
              {{ block.statusLabel }}
            </span>
          </div>
        </div>
      </button>
    </div>

    <p
      v-if="!compact && selectionLabel"
      class="text-sm text-gray-600 dark:text-gray-300 mt-4"
    >
      {{ $t("bookingTimeWindowSelection.selected") }}:
      <span class="font-semibold text-gray-900 dark:text-white">
        {{ selectionLabel }}
      </span>
    </p>

    <div
      v-if="isLoading"
      :class="compact ? 'flex items-center justify-center py-2' : 'flex items-center justify-center py-4'"
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
  compact: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "change"]);

const navButtonClass = computed(() =>
  props.compact
    ? "shrink-0 w-7 h-7 flex items-center justify-center rounded-md border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary dark:hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
    : "flex items-center max-w-20 sm:max-w-none px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-primary dark:hover:border-primary disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:border-gray-200 disabled:dark:hover:border-gray-700 transition-colors text-sm font-medium",
);

const { t, locale } = useI18n();
const { getBlockPeriods } = useBookables();

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

function pad2(n) {
  return n.toString().padStart(2, "0");
}

function toDateParam(date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatEur(value) {
  if (value === null || value === undefined) return "–";
  return (
    value.toLocaleString(locale.value === "en" ? "en-GB" : "de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function formatTime(date) {
  return date.toLocaleTimeString(locale.value === "en" ? "en-GB" : "de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBlockDateRange(timeBegin, timeEnd) {
  const start = new Date(timeBegin);
  const end = new Date(timeEnd);
  const startDay = pad2(start.getDate());
  const endDay = pad2(end.getDate());
  const startMonth = MONTH_LABELS_SHORT[start.getMonth()];
  const endMonth = MONTH_LABELS_SHORT[end.getMonth()];

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${startDay}. – ${endDay}. ${endMonth}`;
  }
  return `${startDay}. ${startMonth} – ${endDay}. ${endMonth}`;
}

function formatBlockTimeRange(timeBegin, timeEnd) {
  const start = new Date(timeBegin);
  const end = new Date(timeEnd);
  return `${formatTime(start)} – ${formatTime(end)}`;
}

function formatBlockRangeFull(timeBegin, timeEnd) {
  const weekday = (d) => t(`bookingTimeWindowSelection.weekdays.${d.getDay()}`);
  const start = new Date(timeBegin);
  const end = new Date(timeEnd);
  const datePart = (d) => `${pad2(d.getDate())}.${pad2(d.getMonth() + 1)}.`;

  return `${weekday(start)}, ${datePart(start)} ${formatTime(start)} – ${weekday(end)}, ${datePart(end)} ${formatTime(end)}`;
}

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

const visibleRange = computed(() => {
  const year = displayYear.value;
  const month = displayMonth.value;
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    startDate: toDateParam(start),
    endDate: toDateParam(end),
  };
});

const blockPeriods = ref([]);
const isLoading = ref(false);
const blockPeriodCache = new Map();

function buildCacheKey(tenantId, bookableId, startDate, endDate, amount) {
  return `${tenantId}|${bookableId}|${startDate}|${endDate}|${amount}`;
}

watch(
  () => [props.tenantId, props.bookableId, props.amount],
  () => {
    blockPeriodCache.clear();
  },
);

async function fetchBlockPeriods() {
  const range = visibleRange.value;
  if (!props.tenantId || !props.bookableId || !range) {
    blockPeriods.value = [];
    return;
  }

  const cacheKey = buildCacheKey(
    props.tenantId,
    props.bookableId,
    range.startDate,
    range.endDate,
    props.amount,
  );

  if (blockPeriodCache.has(cacheKey)) {
    blockPeriods.value = blockPeriodCache.get(cacheKey);
    return;
  }

  isLoading.value = true;
  try {
    const data = await getBlockPeriods({
      tenantID: props.tenantId,
      bookableId: props.bookableId,
      startDate: range.startDate,
      endDate: range.endDate,
      amount: props.amount,
    });

    const result = Array.isArray(data?.blockPeriods) ? data.blockPeriods : [];
    blockPeriodCache.set(cacheKey, result);
    blockPeriods.value = result;
  } catch {
    blockPeriods.value = [];
  } finally {
    isLoading.value = false;
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
    fetchBlockPeriods();
  },
  { immediate: true },
);

function statusLabelFor(block) {
  if (block.isPast) return t("weekSelection.past");
  if (block.selectable) return t("weekSelection.available");
  if (block.reason === "permission") {
    return t("bookingTimeWindowSelection.permissionRequired");
  }
  if (block.reason === "max-booking-date") {
    return t("bookingTimeWindowSelection.maxBookingDate");
  }
  return t("weekSelection.occupied");
}

const blockPeriodCards = computed(() => {
  const nowMs = Date.now();

  return [...blockPeriods.value]
    .sort((a, b) => a.timeBegin - b.timeBegin)
    .map((block) => {
      const isPast = block.timeEnd < nowMs;
      const selectable = block.available === true && !isPast;

      return {
        ...block,
        key: `${block.blockPeriodId}-${block.timeBegin}`,
        rangeLabel: formatBlockDateRange(block.timeBegin, block.timeEnd),
        timeLabel: formatBlockTimeRange(block.timeBegin, block.timeEnd),
        isPast,
        selectable,
        statusLabel: statusLabelFor({ ...block, isPast, selectable }),
      };
    });
});

const displayBlockPeriodCards = computed(() => {
  if (!props.compact) return blockPeriodCards.value;
  return blockPeriodCards.value.filter((block) => block.selectable);
});

const selectedStartMs = ref(null);
const selectedEndMs = ref(null);

const selectionLabel = computed(() => {
  if (selectedStartMs.value == null || selectedEndMs.value == null) {
    return null;
  }
  const selected = blockPeriodCards.value.find(
    (b) =>
      b.timeBegin === selectedStartMs.value &&
      b.timeEnd === selectedEndMs.value,
  );
  if (selected) {
    return `${selected.label}: ${formatBlockRangeFull(selected.timeBegin, selected.timeEnd)}`;
  }
  const label = props.modelValue?.label;
  if (label && selectedStartMs.value != null && selectedEndMs.value != null) {
    return `${label}: ${formatBlockRangeFull(selectedStartMs.value, selectedEndMs.value)}`;
  }
  return formatBlockRangeFull(selectedStartMs.value, selectedEndMs.value);
});

function selectBlock(block) {
  if (!block.selectable) return;

  selectedStartMs.value = block.timeBegin;
  selectedEndMs.value = block.timeEnd;

  const payload = {
    start: block.timeBegin,
    end: block.timeEnd,
    blockPeriodId: block.blockPeriodId,
    label: block.label,
  };
  emit("update:modelValue", payload);
  emit("change", payload);
}

function isSelectedBlock(block) {
  return (
    block.timeBegin === selectedStartMs.value &&
    block.timeEnd === selectedEndMs.value
  );
}

function getBlockCardClass(block) {
  if (!block.selectable) {
    return "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/40 cursor-not-allowed opacity-70";
  }
  if (isSelectedBlock(block)) {
    return "border-primary dark:border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary dark:ring-primary cursor-pointer";
  }
  return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary dark:hover:border-primary cursor-pointer";
}

watch(
  () => props.modelValue,
  (v) => {
    if (!v || (v.start == null && v.end == null)) {
      selectedStartMs.value = null;
      selectedEndMs.value = null;
      return;
    }
    selectedStartMs.value =
      typeof v.start === "number" ? v.start : Number(v.start) || null;
    selectedEndMs.value =
      typeof v.end === "number" ? v.end : Number(v.end) || null;
    if (selectedStartMs.value != null) {
      onJumpDate(new Date(selectedStartMs.value));
    }
  },
  { immediate: true, deep: true },
);
</script>

<style scoped></style>
