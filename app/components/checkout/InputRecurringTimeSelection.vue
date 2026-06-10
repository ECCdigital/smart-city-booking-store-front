<script setup>
import { computed, watch, ref } from "vue";
import InputTime from "~/components/inputs/InputTime.vue";
import InputDate from "~/components/inputs/InputDate.vue";
import {
  generateBookingAttempts,
  ORDINAL_OPTIONS,
  WEEKDAY_ORDER,
} from "~/utils/recurrence.js";

const props = defineProps({
  tenantId: { type: String, default: null },
  bookableId: { type: String, default: null },
  /**
   * Per-attempt validation results, keyed by start timestamp.
   * { [start]: { valid: boolean, reason?: string, params?: object } }
   */
  attemptStatuses: {
    type: Object,
    default: () => ({}),
  },
  isValidating: { type: Boolean, default: false },
  modelValue: {
    type: Object,
    default: () => ({
      seedStart: null,
      seedEnd: null,
      until: null,
      interval: 1,
      frequency: "weekly",
      byWeekday: null,
      monthlyMode: "day-of-month",
      monthlyDayOfMonth: null,
      monthlyWeekday: null,
      monthlyWeekdayOrdinal: 1,
    }),
  },
});

const emit = defineEmits(["update:modelValue", "update:attempts"]);

const { t, locale } = useI18n();

const intlLocale = computed(() => (locale.value === "de" ? "de-DE" : "en-GB"));

const pad2 = (n) => String(n).padStart(2, "0");

const localISODate = (date) => {
  if (!date) return "";
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(
    date.getDate(),
  )}`;
};

const parseLocalDate = (iso) => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

const timeFromString = (str) => {
  if (!str) return null;
  const [h, m] = str.split(":").map(Number);
  return { hours: h || 0, minutes: m || 0 };
};

const timeToString = (val) =>
  val ? `${pad2(val.hours)}:${pad2(val.minutes || 0)}` : "";

const startDateInput = ref("");
const startTimeInput = ref("");
const endDateInput = ref("");
const endTimeInput = ref("");
const untilDateInput = ref("");

const untilInputDate = computed({
  get: () => parseLocalDate(untilDateInput.value),
  set: (d) => {
    untilDateInput.value = d ? localISODate(d) : "";
  },
});

const frequency = ref("weekly");
const interval = ref(1);
const weeklyByWeekday = ref([]);
const monthlyMode = ref("day-of-month");
const monthlyDayOfMonth = ref(null);
const monthlyWeekday = ref(null);
const monthlyWeekdayOrdinal = ref(1);

const startInputDate = computed({
  get: () => parseLocalDate(startDateInput.value),
  set: (d) => {
    startDateInput.value = d ? localISODate(d) : "";
  },
});

const endInputDate = computed({
  get: () => parseLocalDate(endDateInput.value),
  set: (d) => {
    endDateInput.value = d ? localISODate(d) : "";
  },
});

const startTime = computed({
  get: () => timeFromString(startTimeInput.value),
  set: (val) => {
    startTimeInput.value = val ? timeToString(val) : "";
  },
});

const endTime = computed({
  get: () => timeFromString(endTimeInput.value),
  set: (val) => {
    endTimeInput.value = val ? timeToString(val) : "";
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

function sameSortedWeekdays(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  for (let i = 0; i < sa.length; i++) {
    if (sa[i] !== sb[i]) return false;
  }
  return true;
}

function applyFrequencyDefaults() {
  const sd = parseLocalDate(startDateInput.value);
  if (!sd) return;
  if (frequency.value === "weekly") {
    if (
      !Array.isArray(weeklyByWeekday.value) ||
      weeklyByWeekday.value.length === 0
    ) {
      weeklyByWeekday.value = [sd.getDay()];
    }
  }
  if (frequency.value === "monthly") {
    if (
      monthlyMode.value === "day-of-month" &&
      monthlyDayOfMonth.value == null
    ) {
      monthlyDayOfMonth.value = sd.getDate();
    }
    if (
      monthlyMode.value === "weekday-of-month" &&
      monthlyWeekday.value == null
    ) {
      monthlyWeekday.value = sd.getDay();
    }
  }
}

watch(startDateInput, applyFrequencyDefaults);
watch(frequency, applyFrequencyDefaults);
watch(monthlyMode, applyFrequencyDefaults);

function onStartChange() {
  applyDefaultEndFromStart();
}

const seedStartMs = computed(() => {
  if (!startDateInput.value || !startTimeInput.value) return null;
  const sd = parseLocalDate(startDateInput.value);
  if (!sd) return null;
  const [h, m] = startTimeInput.value.split(":").map(Number);
  return new Date(
    sd.getFullYear(),
    sd.getMonth(),
    sd.getDate(),
    h,
    m || 0,
  ).getTime();
});

const seedEndMs = computed(() => {
  if (!endDateInput.value || !endTimeInput.value) return null;
  const ed = parseLocalDate(endDateInput.value);
  if (!ed) return null;
  const [h, m] = endTimeInput.value.split(":").map(Number);
  return new Date(
    ed.getFullYear(),
    ed.getMonth(),
    ed.getDate(),
    h,
    m || 0,
  ).getTime();
});

const untilMs = computed(() => {
  if (!untilDateInput.value) return null;
  const d = parseLocalDate(untilDateInput.value);
  if (!d) return null;
  return d.getTime();
});

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return;
    if (v.seedStart && v.seedStart !== seedStartMs.value) {
      const d = new Date(v.seedStart);
      startDateInput.value = localISODate(d);
      startTimeInput.value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    if (v.seedEnd && v.seedEnd !== seedEndMs.value) {
      const d = new Date(v.seedEnd);
      endDateInput.value = localISODate(d);
      endTimeInput.value = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    }
    if (v.until && v.until !== untilMs.value) {
      const d = new Date(v.until);
      untilDateInput.value = localISODate(d);
    }
    if (
      (v.frequency === "weekly" || v.frequency === "monthly") &&
      v.frequency !== frequency.value
    ) {
      frequency.value = v.frequency;
    }
    if (
      typeof v.interval === "number" &&
      v.interval >= 1 &&
      v.interval !== interval.value
    ) {
      interval.value = v.interval;
    }
    if (
      Array.isArray(v.byWeekday) &&
      !sameSortedWeekdays(v.byWeekday, weeklyByWeekday.value)
    ) {
      weeklyByWeekday.value = [...v.byWeekday];
    }
    if (
      (v.monthlyMode === "day-of-month" ||
        v.monthlyMode === "weekday-of-month") &&
      v.monthlyMode !== monthlyMode.value
    ) {
      monthlyMode.value = v.monthlyMode;
    }
    if (
      v.monthlyDayOfMonth != null &&
      v.monthlyDayOfMonth !== monthlyDayOfMonth.value
    ) {
      monthlyDayOfMonth.value = v.monthlyDayOfMonth;
    }
    if (v.monthlyWeekday != null && v.monthlyWeekday !== monthlyWeekday.value) {
      monthlyWeekday.value = v.monthlyWeekday;
    }
    if (
      v.monthlyWeekdayOrdinal != null &&
      v.monthlyWeekdayOrdinal !== monthlyWeekdayOrdinal.value
    ) {
      monthlyWeekdayOrdinal.value = v.monthlyWeekdayOrdinal;
    }
  },
  { immediate: true },
);

const committedAttempts = ref([]);
const committedSignature = ref("");

function buildRuleSnapshot() {
  return {
    seedStart: seedStartMs.value,
    seedEnd: seedEndMs.value,
    until: untilMs.value,
    interval: interval.value,
    frequency: frequency.value,
    byWeekday: frequency.value === "weekly" ? [...weeklyByWeekday.value] : null,
    monthlyMode: frequency.value === "monthly" ? monthlyMode.value : null,
    monthlyDayOfMonth:
      frequency.value === "monthly" && monthlyMode.value === "day-of-month"
        ? monthlyDayOfMonth.value
        : null,
    monthlyWeekday:
      frequency.value === "monthly" && monthlyMode.value === "weekday-of-month"
        ? monthlyWeekday.value
        : null,
    monthlyWeekdayOrdinal:
      frequency.value === "monthly" && monthlyMode.value === "weekday-of-month"
        ? monthlyWeekdayOrdinal.value
        : null,
  };
}

function ruleSignature(rule) {
  return JSON.stringify(rule);
}

const currentRule = computed(() => buildRuleSnapshot());
const currentSignature = computed(() => ruleSignature(currentRule.value));

const canGenerate = computed(() => {
  if (seedStartMs.value == null || seedEndMs.value == null) return false;
  if (seedEndMs.value <= seedStartMs.value) return false;
  if (frequency.value === "weekly") {
    if (
      !Array.isArray(weeklyByWeekday.value) ||
      weeklyByWeekday.value.length === 0
    ) {
      return false;
    }
  }
  if (
    frequency.value === "monthly" &&
    monthlyMode.value === "weekday-of-month"
  ) {
    if (monthlyWeekday.value == null || monthlyWeekdayOrdinal.value == null) {
      return false;
    }
  }
  if (frequency.value === "monthly" && monthlyMode.value === "day-of-month") {
    if (monthlyDayOfMonth.value == null) return false;
  }
  return true;
});

const isStale = computed(
  () =>
    committedAttempts.value.length > 0 &&
    committedSignature.value !== currentSignature.value,
);

function generateNow() {
  if (!canGenerate.value) return;
  const list = generateBookingAttempts({
    seedStart: seedStartMs.value,
    seedEnd: seedEndMs.value,
    until: untilMs.value,
    interval: interval.value,
    frequency: frequency.value,
    byWeekday: frequency.value === "weekly" ? weeklyByWeekday.value : null,
    monthlyMode: monthlyMode.value,
    monthlyDayOfMonth: monthlyDayOfMonth.value,
    monthlyWeekday: monthlyWeekday.value,
    monthlyWeekdayOrdinal: monthlyWeekdayOrdinal.value,
  });
  committedAttempts.value = list;
  committedSignature.value = currentSignature.value;
  emit("update:attempts", list);
}

function resetAttempts() {
  if (committedAttempts.value.length === 0) return;
  committedAttempts.value = [];
  committedSignature.value = "";
  emit("update:attempts", []);
}

function removeAttempt(start) {
  const next = committedAttempts.value.filter((a) => a.start !== start);
  if (next.length === committedAttempts.value.length) return;
  committedAttempts.value = next;
  emit("update:attempts", next);
}

watch(
  [
    seedStartMs,
    seedEndMs,
    untilMs,
    interval,
    frequency,
    weeklyByWeekday,
    monthlyMode,
    monthlyDayOfMonth,
    monthlyWeekday,
    monthlyWeekdayOrdinal,
  ],
  () => {
    emit("update:modelValue", buildRuleSnapshot());
    if (
      committedAttempts.value.length > 0 &&
      committedSignature.value !== currentSignature.value
    ) {
      resetAttempts();
    }
  },
  { deep: true },
);

function toggleWeekday(value) {
  const set = new Set(weeklyByWeekday.value);
  if (set.has(value)) set.delete(value);
  else set.add(value);
  weeklyByWeekday.value = [...set].sort((a, b) => a - b);
}

const weekdayShortLabel = (jsDay) => {
  const tmp = new Date(2024, 0, 7); // Sunday (day=0)
  tmp.setDate(tmp.getDate() + jsDay);
  return tmp
    .toLocaleDateString(intlLocale.value, { weekday: "short" })
    .replace(/\.$/, "");
};

const weekdayLongLabel = (jsDay) => {
  const tmp = new Date(2024, 0, 7); // Sunday (day=0)
  tmp.setDate(tmp.getDate() + jsDay);
  return tmp.toLocaleDateString(intlLocale.value, { weekday: "long" });
};

const formatAttempt = (start, end) => {
  const s = new Date(start);
  const e = new Date(end);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();
  const sStr = s.toLocaleString(intlLocale.value, {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const eStr = sameDay
    ? e.toLocaleTimeString(intlLocale.value, {
        hour: "2-digit",
        minute: "2-digit",
      })
    : e.toLocaleString(intlLocale.value, {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  return `${sStr} – ${eStr}`;
};

const ordinalOptions = ORDINAL_OPTIONS.map((o) => ({
  value: o.value,
  label: t(`groupBooking.ordinals.${o.key}`),
}));

const statusFor = (start) => props.attemptStatuses?.[start] || null;

const totalCount = computed(() => committedAttempts.value.length);
const invalidCount = computed(() => {
  let count = 0;
  for (const a of committedAttempts.value) {
    const status = statusFor(a.start);
    if (status && status.valid === false) count += 1;
  }
  return count;
});
const validatedCount = computed(() => {
  let count = 0;
  for (const a of committedAttempts.value) {
    if (statusFor(a.start)) count += 1;
  }
  return count;
});

function getWeekDayCardClass(wd) {
  if (weeklyByWeekday?.value.includes(wd)) {
    return "border-primary dark:border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary dark:ring-primary cursor-pointer";
  }
  return "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-primary dark:hover:border-primary cursor-pointer";
}
</script>

<template>
  <div class="@container space-y-6">
    <!-- Start / End -->
    <p class="font-semibold text-gray-500 dark:text-gray-400">
      {{ $t("groupBooking.fields.timeExplanation") }}
    </p>
    <div class="grid grid-cols-1 @lg:grid-cols-2 gap-4">
      <div>
        <label
          class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
        >
          {{ $t("groupBooking.fields.firstStart") }}
        </label>
        <InputTime
          v-model="startTime"
          v-model:date="startInputDate"
          show-date
          class="w-full"
          @update:model-value="onStartChange"
          @update:date="onStartChange"
        />
      </div>
      <div>
        <label
          class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
        >
          {{ $t("groupBooking.fields.firstEnd") }}
        </label>
        <InputTime
          v-model="endTime"
          v-model:date="endInputDate"
          show-date
          :disabled="!startTime"
          class="w-full"
        />
      </div>
    </div>

    <!-- Rhythm / interval -->
    <p class="font-semibold text-gray-500 dark:text-gray-400 mt-10">
      {{ $t("groupBooking.fields.rhythmExplanation") }}
    </p>
    <div class="space-x-1">
      <label
        class="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
      >
        {{ $t("groupBooking.fields.each") }}
      </label>
      <UInput v-model.number="interval" type="number" :min="1" :max="52" />
      <USelect
        v-model="frequency"
        :items="[
          { label: $t('groupBooking.frequency.weeks'), value: 'weekly' },
          { label: $t('groupBooking.frequency.months'), value: 'monthly' },
        ]"
      />
      <span
        class="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
      >
        {{ $t("groupBooking.fields.repeat") }}
      </span>
    </div>

    <div class="">
      <!-- Weekly options -->
      <div v-if="frequency === 'weekly'" class="space-y-2">
        <label
          class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400"
        >
          {{ $t("groupBooking.fields.weekdays") }}
        </label>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="wd in WEEKDAY_ORDER"
            :key="wd"
            type="button"
            :title="weekdayLongLabel(wd)"
            :aria-label="weekdayLongLabel(wd)"
            class="px-3 py-1.5 rounded-md text-xs font-semibold border transition-colors"
            :class="getWeekDayCardClass(wd)"
            @click="toggleWeekday(wd)"
          >
            {{ weekdayShortLabel(wd) }}
          </button>
        </div>
      </div>

      <!-- Monthly options -->
      <div v-else class="space-y-3">
        <div
          class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-6 py-2"
        >
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              v-model="monthlyMode"
              type="radio"
              value="day-of-month"
              class="accent-primary"
            >
            {{ $t("groupBooking.fields.monthlyByDay") }}
          </label>
          <label class="inline-flex items-center gap-2 text-sm">
            <input
              v-model="monthlyMode"
              type="radio"
              value="weekday-of-month"
              class="accent-primary"
            >
            {{ $t("groupBooking.fields.monthlyByWeekday") }}
          </label>
        </div>

        <div v-if="monthlyMode === 'day-of-month'" class="max-w-xs space-x-1">
          <label
            class="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
          >
            {{ $t("groupBooking.fields.dayOfMonth") }}
          </label>
          <UInput
            v-model.number="monthlyDayOfMonth"
            type="number"
            :min="1"
            :max="31"
          />
        </div>

        <div v-else class="max-w-lg space-x-1">
          <label
            class="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
          >
            {{ $t("groupBooking.fields.every") }}
          </label>
          <USelect v-model="monthlyWeekdayOrdinal" :items="ordinalOptions" />
          <USelect
            v-model="monthlyWeekday"
            :items="
              WEEKDAY_ORDER.map((wd) => ({
                label: weekdayLongLabel(wd),
                value: wd,
              }))
            "
          />
          <span
            class="text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
          >
            {{ $t("groupBooking.fields.ofMonth") }}
          </span>
        </div>
      </div>
    </div>
    <!-- until  -->

    <p class="font-semibold text-gray-500 dark:text-gray-400 mt-10">
      {{ $t("groupBooking.fields.untilExplanation") }}
    </p>
    <div class="w-[50%] mr-5">
      <label
        class="block text-[11px] font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5"
      >
        {{ $t("groupBooking.fields.until") }}
      </label>
      <InputDate
        v-model="untilInputDate"
        disable-past
        :dialog-title="$t('groupBooking.fields.untilDialogTitle')"
        :dialog-description="$t('groupBooking.fields.untilDialogDescription')"
        class="w-full"
      />
    </div>

    <!-- Generate trigger -->
    <div
      class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mt-10"
    >
      <div class="flex items-center gap-2">
        <UButton
          color="primary"
          icon="i-lucide-list-plus"
          :disabled="!canGenerate"
          @click="generateNow"
        >
          {{
            totalCount > 0
              ? $t("groupBooking.actions.regenerate")
              : $t("groupBooking.actions.generate")
          }}
        </UButton>
        <UButton
          v-if="totalCount > 0"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          @click="resetAttempts"
        >
          {{ $t("groupBooking.actions.clear") }}
        </UButton>
      </div>
      <p v-if="!canGenerate" class="text-xs text-gray-500 dark:text-gray-400">
        {{ $t("groupBooking.actions.hint") }}
      </p>
    </div>

    <!-- Preview -->
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <h4 class="text-sm font-semibold text-gray-700 dark:text-gray-200">
          {{ $t("groupBooking.preview.title") }}
        </h4>
        <span
          v-if="totalCount > 0"
          class="text-xs text-gray-500 dark:text-gray-400"
        >
          {{
            $t("groupBooking.preview.counts", {
              total: totalCount,
              invalid: invalidCount,
              validated: validatedCount,
            })
          }}
        </span>
      </div>

      <div
        v-if="isStale"
        class="flex items-start gap-2.5 p-3 rounded-md border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50"
      >
        <UIcon
          name="i-lucide-alert-triangle"
          class="text-amber-500 flex-shrink-0 mt-0.5"
          size="16"
        />
        <p class="text-sm text-amber-700 dark:text-amber-300">
          {{ $t("groupBooking.preview.stale") }}
        </p>
      </div>

      <p
        v-if="totalCount === 0"
        class="text-sm text-gray-500 dark:text-gray-400 italic"
      >
        {{ $t("groupBooking.preview.empty") }}
      </p>

      <ul
        v-else
        class="divide-y divide-gray-200 dark:divide-gray-700 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-900"
      >
        <li
          v-for="attempt in committedAttempts"
          :key="attempt.start"
          class="flex items-start justify-between gap-3 px-3 py-2 text-sm"
          :class="
            statusFor(attempt.start)?.valid === false
              ? 'bg-red-50 dark:bg-red-950/40'
              : statusFor(attempt.start)?.valid === true
                ? 'bg-green-50 dark:bg-green-950/30'
                : ''
          "
        >
          <div class="min-w-0 flex-1">
            <p class="font-medium text-gray-800 dark:text-gray-200 break-words">
              {{ formatAttempt(attempt.start, attempt.end) }}
            </p>
            <p
              v-if="statusFor(attempt.start)?.valid === false"
              class="text-xs text-red-700 dark:text-red-300 mt-0.5"
            >
              {{
                $t(statusFor(attempt.start)?.reason || "checkout.unknown_error")
              }}
            </p>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span
              class="text-xs font-semibold inline-flex items-center gap-1"
              :class="
                statusFor(attempt.start)?.valid === false
                  ? 'text-red-600 dark:text-red-300'
                  : statusFor(attempt.start)?.valid === true
                    ? 'text-green-600 dark:text-green-300'
                    : 'text-gray-400 dark:text-gray-500'
              "
            >
              <template v-if="!statusFor(attempt.start)">
                <UIcon
                  v-if="isValidating"
                  name="i-lucide-loader-2"
                  class="animate-spin"
                  size="14"
                />
                <span v-else>{{ $t("groupBooking.preview.pending") }}</span>
              </template>
              <template v-else-if="statusFor(attempt.start).valid">
                <UIcon name="i-lucide-check-circle-2" size="14" />
                {{ $t("groupBooking.preview.valid") }}
              </template>
              <template v-else>
                <UIcon name="i-lucide-alert-triangle" size="14" />
                {{ $t("groupBooking.preview.invalid") }}
              </template>
            </span>
            <UTooltip :text="$t('groupBooking.preview.remove')">
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="xs"
                :aria-label="$t('groupBooking.preview.remove')"
                @click="removeAttempt(attempt.start)"
              />
            </UTooltip>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>
