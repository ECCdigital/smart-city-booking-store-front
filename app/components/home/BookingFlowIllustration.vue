<template>
  <!--
    A still of the booking flow for the start page: the list page's search bar,
    the checkout stepper with the date grid and the price bar, and the status
    page's thank-you banner. Nothing here works — it only shows what the three
    steps look like — so it is decorative and is hidden from assistive
    technology by its parent. The sample dates are computed from today, so the
    picture never shows a week that has passed.
  -->
  <div
    class="min-w-0 rounded-xl bg-neutral-50 dark:bg-gray-900 p-3 md:p-5 space-y-3 select-none"
  >
    <!-- Search bar as on the list page -->
    <div
      class="flex items-center gap-1 rounded bg-white dark:bg-gray-700 shadow-lg p-2 text-xs"
    >
      <div
        class="flex items-center gap-2 px-2.5 h-9 min-w-0 text-gray-900 dark:text-gray-100"
      >
        <UIcon
          name="i-lucide-search"
          class="text-gray-400 dark:text-gray-300 shrink-0"
        />
        <span class="font-semibold truncate">{{
          $t("home.howItWorks.sample.keyword")
        }}</span>
      </div>
      <USeparator
        orientation="vertical"
        class="h-5"
        :ui="{ border: 'border-gray-300' }"
      />
      <div
        class="flex items-center gap-2 px-2.5 h-9 text-gray-900 dark:text-gray-100 min-w-0"
      >
        <UIcon
          name="i-lucide-map-pin"
          class="text-gray-400 dark:text-gray-300 shrink-0"
        />
        <span class="font-semibold truncate">{{
          $t("home.howItWorks.sample.place")
        }}</span>
      </div>
      <USeparator
        orientation="vertical"
        class="h-5 hidden sm:block"
        :ui="{ border: 'border-gray-300' }"
      />
      <div
        class="hidden sm:flex items-center gap-2 px-2.5 h-9 text-gray-400 dark:text-gray-300"
      >
        <UIcon name="i-lucide-calendar" class="shrink-0" />
        <span>{{ $t("filter.period") }}</span>
      </div>
      <div class="flex-1" />
      <UButton
        :label="$t('common.search')"
        size="sm"
        class="pointer-events-none"
        :style="{ color: contrastToPrimary }"
        tabindex="-1"
      />
    </div>

    <!-- Checkout stepper, first step -->
    <div
      class="rounded-xl bg-white dark:bg-gray-700 shadow-lg p-3 md:p-4 space-y-3"
    >
      <div class="flex gap-1.5">
        <div
          v-for="n in 4"
          :key="n"
          class="flex-1 h-1 rounded-full"
          :class="n === 1 ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-600'"
        />
      </div>
      <div class="flex items-baseline justify-between gap-4">
        <p class="font-bold text-gray-900 dark:text-white">
          {{ $t("checkout.steps.periodTitle") }}
        </p>
        <span
          class="text-[11px] text-gray-500 dark:text-gray-400 whitespace-nowrap"
        >
          {{ $t("stepper.stepOf", { current: 1, total: 4 }) }}
        </span>
      </div>

      <div
        class="grid gap-3 md:grid-cols-[minmax(0,1fr)_13.5rem] md:items-start"
      >
        <!-- Date and time selection -->
        <div class="min-w-0 space-y-2.5">
          <p
            class="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500"
          >
            <UIcon name="i-lucide-calendar-days" />
            {{ $t("timePeriods.selectDate") }}
          </p>
          <div class="grid grid-cols-7 gap-1">
            <div
              v-for="day in days"
              :key="day.key"
              class="relative min-w-0 flex flex-col items-center justify-center py-1.5 px-0 rounded-md border"
              :class="dayClass(day)"
              :style="onPrimaryStyle(day)"
            >
              <span class="text-[9px] font-semibold tracking-wider uppercase">
                {{ day.weekday }}
              </span>
              <span
                class="text-base font-extrabold leading-none my-0.5 tabular-nums"
              >
                {{ day.number }}
              </span>
              <span class="text-[9px]">{{ day.month }}</span>
              <span
                v-if="day.state === 'booked'"
                class="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-100 dark:bg-red-900/40 text-red-500 dark:text-red-400 flex items-center justify-center"
              >
                <UIcon name="i-lucide-x" class="text-[9px]" />
              </span>
            </div>
          </div>

          <p
            class="flex items-center gap-1.5 text-[11px] font-bold tracking-widest uppercase text-gray-400 dark:text-gray-500"
          >
            <UIcon name="i-lucide-clock" />
            {{ $t("timePeriods.selectTime") }}
          </p>
          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="slot in slots"
              :key="slot.label"
              class="px-2.5 py-1.5 rounded-md border text-[11px] font-semibold whitespace-nowrap tabular-nums"
              :class="slotClass(slot)"
              :style="onPrimaryStyle(slot)"
            >
              {{ slot.label }}
            </span>
          </div>
        </div>

        <!-- Price bar: every amount stays on one line with its currency sign -->
        <div
          class="rounded-xl border border-gray-200 dark:border-gray-600 bg-white/95 dark:bg-gray-800/95 shadow-2xl p-3.5 space-y-2 text-xs"
        >
          <div class="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <UIcon name="i-lucide-calendar" class="text-primary shrink-0" />
            <span>{{ periodLabel }}</span>
          </div>
          <div
            v-for="line in priceLines"
            :key="line.label"
            class="flex items-baseline justify-between gap-3 text-gray-700 dark:text-gray-200"
          >
            <span class="min-w-0">{{ line.label }}</span>
            <span class="shrink-0 whitespace-nowrap tabular-nums">{{
              line.amount
            }}</span>
          </div>
          <USeparator
            :ui="{ border: 'border-gray-200 dark:border-gray-600' }"
          />
          <div
            class="flex items-baseline justify-between gap-3 font-bold text-gray-900 dark:text-white"
          >
            <span>{{ $t("booking.total") }}</span>
            <span class="shrink-0 whitespace-nowrap tabular-nums">{{
              totalAmount
            }}</span>
          </div>
        </div>
      </div>

      <div
        class="flex items-center justify-between gap-4 pt-3 border-t border-gray-200 dark:border-gray-600"
      >
        <span
          class="inline-flex items-center gap-1.5 text-xs font-semibold text-primary"
        >
          <UIcon name="i-lucide-arrow-left" />
          {{ $t("stepper.back") }}
        </span>
        <UButton
          :label="$t('stepper.next')"
          trailing-icon="i-lucide-arrow-right"
          size="sm"
          class="pointer-events-none"
          :style="{ color: contrastToPrimary }"
          tabindex="-1"
        />
      </div>
    </div>

    <!-- Status page after the booking -->
    <div
      class="rounded-xl bg-white dark:bg-gray-700 shadow-lg p-3 md:p-4 space-y-3"
    >
      <div class="flex items-center justify-between gap-4">
        <p class="font-bold text-gray-900 dark:text-white">
          {{ $t("checkout.status.pageTitle") }}
        </p>
        <span
          class="inline-flex items-center gap-1.5 text-[11px] text-gray-600 dark:text-gray-300"
        >
          <UIcon name="i-lucide-refresh-cw" class="text-primary-500" />
          {{ $t("checkout.status.lastUpdatedLabel") }}
        </span>
      </div>
      <div class="rounded-xl bg-primary/20 px-5 py-4 space-y-1">
        <p class="font-semibold text-gray-900 dark:text-white">
          {{ $t("checkout.status.thankYouTitle") }}
        </p>
        <p class="text-xs leading-5 text-gray-700 dark:text-gray-200">
          {{ $t("checkout.status.thankYouBody") }}
          {{ $t("checkout.status.invoiceMailHint") }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";

const { t } = useI18n();
const { contrastToPrimary } = useContrastColor();
const { formatTime, localeTag } = useFormatting();

// The sample booking: the next Friday from tomorrow on, 09:00–12:00.
const sampleDay = computed(() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 1);
  while (d.getDay() !== 5) d.setDate(d.getDate() + 1);
  return d;
});

function at(day, hour) {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

// The seven days of the sample's week, Monday first, as the date grid draws them.
const days = computed(() => {
  const monday = new Date(sampleDay.value);
  monday.setDate(monday.getDate() - 4);
  const tag = localeTag();
  const weekday = new Intl.DateTimeFormat(tag, { weekday: "short" });
  const month = new Intl.DateTimeFormat(tag, { month: "short" });
  const states = [
    "free",
    "free",
    "booked",
    "free",
    "selected",
    "closed",
    "closed",
  ];
  return states.map((state, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      key: d.toISOString(),
      weekday: weekday.format(d).replace(".", ""),
      number: d.getDate(),
      month: month.format(d).replace(".", ""),
      state,
    };
  });
});

// A field painted in the primary colour takes the text colour that reads on
// it, whatever the instance's primary is — the same rule as every button.
function onPrimaryStyle({ state }) {
  return state === "selected" ? { color: contrastToPrimary.value } : undefined;
}

function dayClass(day) {
  switch (day.state) {
    case "selected":
      return "border-primary bg-primary";
    case "closed":
      return "border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500";
    default:
      return "border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100";
  }
}

const slots = computed(() =>
  [8, 9, 10, 11, 12, 13, 14, 15].map((hour) => ({
    label: `${formatTime(at(sampleDay.value, hour))} – ${formatTime(at(sampleDay.value, hour + 1))}`,
    state:
      hour >= 9 && hour < 12 ? "selected" : hour === 13 ? "booked" : "free",
  })),
);

function slotClass(slot) {
  switch (slot.state) {
    case "selected":
      return "border-primary bg-primary";
    case "booked":
      return "border-gray-200 dark:border-gray-600 text-gray-400 dark:text-gray-500 line-through";
    default:
      return "border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200";
  }
}

// Date only — useFormatting's formatDate carries the time of day as well.
function formatDay(date) {
  return date.toLocaleDateString(localeTag(), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const periodLabel = computed(() =>
  t("home.howItWorks.sample.period", {
    date: formatDay(sampleDay.value),
    start: formatTime(at(sampleDay.value, 9)),
    end: formatTime(at(sampleDay.value, 12)),
  }),
);

// Formatted with the page's locale so the sign sits where the language puts it;
// the template keeps sign and figure on one line.
function formatEur(value) {
  return new Intl.NumberFormat(localeTag(), {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

const priceLines = computed(() => [
  { label: t("home.howItWorks.sample.roomLine"), amount: formatEur(54) },
  { label: t("home.howItWorks.sample.extraLine"), amount: formatEur(10) },
]);
const totalAmount = computed(() => formatEur(64));
</script>

<style scoped></style>
