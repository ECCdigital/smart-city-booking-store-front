<script setup>
const props = defineProps({
  summary: {
    type: Object,
    default: null,
  },
  selectedTimePeriod: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  needsTimePeriodSelection: {
    type: Boolean,
    default: false,
  },
  isValidating: {
    type: Boolean,
    default: false,
  },
  amounts: {
    type: Object,
    default: () => ({}),
  },
  leadBookableId: {
    type: String,
    default: null,
  },
  mandatoryIds: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:amount"]);


function formatEur(value) {
  if (value === null || value === undefined) return "–";
  return (
    value.toLocaleString("de-DE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatTime(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const formattedTimePeriod = computed(() => {
  const { start, end } = props.selectedTimePeriod || {};
  if (!start || !end) return null;

  const startDate = new Date(start);
  const endDate = new Date(end);

  const sameDay = startDate.toDateString() === endDate.toDateString();

  if (sameDay) {
    return `${formatDate(start)}, ${formatTime(start)} – ${formatTime(end)}`;
  }

  return `${formatDate(start)}, ${formatTime(start)} – ${formatDate(end)}, ${formatTime(end)}`;
});


function minAmount(id) {
  if (id === props.leadBookableId) return 1;
  if (props.mandatoryIds.includes(id)) return 1;
  return 0;
}

function increment(id) {
  emit("update:amount", { id, amount: (props.amounts[id] || 1) + 1 });
}

function decrement(id) {
  const current = props.amounts[id] || 1;
  const min = minAmount(id);
  if (current > min) {
    emit("update:amount", { id, amount: current - 1 });
  }
}

function handleDirectInput(id, event) {
  const val = parseInt(event.target.value, 10);
  const min = minAmount(id);
  const clamped = isNaN(val) || val < min ? min : val;
  event.target.value = clamped;
  emit("update:amount", { id, amount: clamped });
}

/** Netto-Zeilenpreis oder Brutto-Gutscheinrabatt (priceDisplayEur) */
function displayPriceCell(item) {
  if (item.priceDisplayEur != null) return item.priceDisplayEur;
  if (item.amountEur != null) return item.amountEur;
  return null;
}

function displayOriginalPriceCell(item) {
  if (item.originalAmountEur != null) return item.originalAmountEur;
  return null;
}

function hasOriginalPriceCell(item) {
  const original = displayOriginalPriceCell(item);
  const current = displayPriceCell(item);
  return original != null && current != null && original > current;
}

function priceCellClass(item) {
  if (item.skipQuantity) return "text-emerald-600 dark:text-emerald-400";
  return null;
}

const hasContent = computed(() => {
  return (
    props.needsTimePeriodSelection ||
    (props.summary &&
      (props.summary.items.length > 0 || props.summary.errors.length > 0))
  );
});
</script>

<template>
  <Transition name="summary-bar">
    <div
      v-if="hasContent"
      class="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-2xl p-4 md:p-5 space-y-3"
    >
      <!-- Loading Overlay -->
      <div
        v-if="isValidating"
        class="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm"
      >
        <UIcon
          name="i-lucide-loader-2"
          size="24"
          class="text-primary animate-spin"
        />
      </div>

      <div
        v-if="formattedTimePeriod"
        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300"
      >
        <UIcon
          name="i-lucide-calendar"
          size="16"
          class="text-primary flex-shrink-0"
        />
        <span>{{ formattedTimePeriod }}</span>
      </div>

      <div
        v-if="needsTimePeriodSelection"
        class="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400"
      >
        <UIcon
          name="i-lucide-calendar-clock"
          size="16"
          class="flex-shrink-0"
        />
        <span>{{ $t("checkout.selectTimePeriodTitle") }}</span>
      </div>

      <template v-else-if="summary">
        <div
          v-for="err in summary.errors"
          :key="`err-${err.id}`"
          class="flex items-center gap-3 p-2.5 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        >
          <UIcon
            name="i-lucide-alert-circle"
            class="text-red-600 dark:text-red-400 flex-shrink-0"
            size="16"
          />

          <div class="flex-1 min-w-0">
            <span
              :title="err.label"
              class="block text-sm font-medium text-red-800 dark:text-red-200 truncate"
            >
              {{ err.label }}
            </span>
            <span class="block text-xs text-red-600 dark:text-red-400 mt-0.5">
              {{ $t(err.reason || "checkout.bookable_unavailable") }}
            </span>
          </div>

          <div class="flex items-center gap-0.5 flex-shrink-0">
            <button
              class="w-5 h-5 flex items-center justify-center rounded text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              :disabled="(amounts[err.id] || 1) <= minAmount(err.id)"
              @click="decrement(err.id)"
            >
              <UIcon name="i-lucide-minus" size="12" />
            </button>
            <input
              type="number"
              :value="amounts[err.id] || 1"
              :min="minAmount(err.id)"
              class="amount-input w-8 h-6 text-center tabular-nums text-sm font-medium text-red-800 dark:text-red-200 bg-transparent border-b border-red-300 dark:border-red-700 focus:border-red-500 focus:outline-none"
              @change="handleDirectInput(err.id, $event)"
            >
            <button
              class="w-5 h-5 flex items-center justify-center rounded text-red-400 dark:text-red-500 hover:text-red-600 dark:hover:text-red-300 transition-colors"
              @click="increment(err.id)"
            >
              <UIcon name="i-lucide-plus" size="12" />
            </button>
          </div>
        </div>

        <div
          v-for="item in summary.items"
          :key="item.id"
          class="flex items-center gap-3 text-sm md:text-base text-gray-700 dark:text-gray-200"
        >
          <span :title="item.label" class="line-clamp-2 flex-1 min-w-0">{{ item.label }}</span>

          <div
            v-if="!item.skipQuantity"
            class="flex items-center gap-0.5 flex-shrink-0"
          >
            <button
              class="w-5 h-5 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
              :disabled="(amounts[item.id] || 1) <= minAmount(item.id)"
              @click="decrement(item.id)"
            >
              <UIcon name="i-lucide-minus" size="12" />
            </button>
            <input
              type="number"
              :value="amounts[item.id] || 1"
              :min="minAmount(item.id)"
              class="amount-input w-8 h-6 text-center tabular-nums text-sm font-medium text-gray-900 dark:text-white bg-transparent border-b border-gray-200 dark:border-gray-700 focus:border-primary focus:outline-none"
              @change="handleDirectInput(item.id, $event)"
            >
            <button
              class="w-5 h-5 flex items-center justify-center rounded text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              @click="increment(item.id)"
            >
              <UIcon name="i-lucide-plus" size="12" />
            </button>
          </div>
          <div v-else class="w-[5.25rem] flex-shrink-0" aria-hidden="true" />

          <!-- Preis -->
          <div
            v-if="displayPriceCell(item) != null"
            class="tabular-nums whitespace-nowrap text-right min-w-[80px]"
          >
            <span
              v-if="hasOriginalPriceCell(item)"
              class="block text-xs text-gray-400 line-through"
            >
              {{ formatEur(displayOriginalPriceCell(item)) }}
            </span>
            <span :class="priceCellClass(item)">
              {{ formatEur(displayPriceCell(item)) }}
            </span>
          </div>
          <span v-else class="text-gray-400 text-right min-w-[80px]">–</span>
        </div>

        <!-- MwSt. -->
        <div
          v-if="summary.taxAmount > 0"
          class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400"
        >
          <span>MwSt.</span>
          <span class="tabular-nums whitespace-nowrap">
            {{ formatEur(summary.taxAmount) }}
          </span>
        </div>

        <div
          class="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between"
        >
          <span
            class="text-base md:text-lg font-bold text-gray-900 dark:text-white"
          >
            Gesamt
          </span>
          <span
            v-if="summary.total > 0"
            class="text-base md:text-lg font-bold tabular-nums whitespace-nowrap text-primary"
          >
            {{ formatEur(summary.total) }}
          </span>
          <span v-else class="text-gray-400">Kostenlos</span>
        </div>
      </template>
    </div>
  </Transition>
</template>

<style scoped>
.summary-bar-enter-active,
.summary-bar-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.summary-bar-enter-from,
.summary-bar-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

.amount-input::-webkit-outer-spin-button,
.amount-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.amount-input {
  -moz-appearance: textfield;
}
</style>
