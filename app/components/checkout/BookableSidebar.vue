<script setup>
import DetailsAreaImages from "~/components/search/DetailsAreaImages.vue";
import HtmlContent from "~/components/HtmlContent.vue";

const props = defineProps({
  /** Das Lead-Bookable (Hauptobjekt der Buchung). */
  leadBookable: {
    type: Object,
    required: true,
  },
  /** Optionaler Tenant – wird als Untertitel angezeigt. */
  tenant: {
    type: Object,
    default: null,
  },
  /**
   * Optionale, von außen vorberechnete Summary für die Preis-Übersichts-Card.
   * Erwartetes Format: { items: [{ label, amountEur }], taxRate, taxAmount, total }.
   * Wenn nicht gesetzt, wird ein einfacher Default aus dem Lead-Bookable berechnet.
   */
  summary: {
    type: Object,
    default: null,
  },
  validationErrors: {
    type: Object,
    default: () => ({}),
  },
  /**
   * Wenn true, wird anstelle der Preisübersicht ein Hinweis angezeigt,
   * dass zuerst ein Zeitraum ausgewählt werden muss.
   */
  needsTimePeriodSelection: {
    type: Boolean,
    default: false,
  },
});

// --- Anzeige-Helfer --------------------------------------------------------

const subtitle = computed(() => props.tenant?.name || "");

// --- Default-Summary -------------------------------------------------------

function getMinPriceEur(bookable) {
  const categories = bookable?.priceCategories || [];
  if (categories.length === 0) return null;

  const internal = categories.filter(
    (c) => !c.external || (c.external && c.unit !== "service-fee")
  );
  const withoutHolidays = internal.filter(
    (c) => !c.holidays || c.holidays.length === 0
  );
  const prices = withoutHolidays
    .map((c) => c.priceEur)
    .filter((p) => p !== null && p !== undefined);

  if (prices.length === 0) return null;
  return Math.min(...prices);
}

const computedSummary = computed(() => {
  return props.summary;
});

function formatEur(value) {
  if (value === null || value === undefined) return "–";
  return value.toFixed(2).replace(/\./g, ",") + " €";
}
</script>

<template>
  <aside class="w-full lg:w-[440px] xl:w-[480px] lg:flex-shrink-0">
    <div class="lg:sticky lg:top-8 space-y-6">
      <!-- Header: Subtitle / Title -->
      <div>
        <p
          v-if="subtitle"
          class="text-sm md:text-base text-gray-500 dark:text-gray-400 mb-1"
        >
          {{ subtitle }}
        </p>

        <h1
          class="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight"
        >
          {{ leadBookable.title }}
        </h1>
      </div>

      <!-- Image -->
      <div class="rounded-lg overflow-hidden">
        <DetailsAreaImages :item="leadBookable" :is-event="false" />
      </div>

      <!-- Description (HTML, kollabierbar) -->
      <HtmlContent
        v-if="leadBookable.description"
        :html="leadBookable.description"
        collapsible
      />

      <!-- Flags -->
      <div
        v-if="leadBookable.flags && leadBookable.flags.length > 0"
        class="flex flex-wrap gap-2"
      >
        <span
          v-for="flag in leadBookable.flags"
          :key="flag"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-700 dark:text-gray-200"
        >
          <UIcon
            name="i-lucide-check"
            class="text-primary dark:text-primary"
            size="16"
          />
          {{ flag }}
        </span>
      </div>

      <!-- Info: selection time period -->
      <div
        v-if="needsTimePeriodSelection"
        class="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950 p-5"
      >
        <div class="flex items-start gap-3">
          <UIcon
            name="i-lucide-calendar-clock"
            class="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5"
            size="20"
          />
          <div class="flex-1">
            <p class="font-semibold text-blue-800 dark:text-blue-200">
              {{ $t('checkout.selectTimePeriodTitle') }}
            </p>
            <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
              {{ $t('checkout.selectTimePeriodHint') }}
            </p>
          </div>
        </div>
      </div>

      <!-- Price Summary Card -->
      <div
        v-else-if="computedSummary"
        class="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-3"
      >
        <!-- Error Items -->
        <div
          v-for="err in computedSummary.errors"
          :key="`error-${err.id}`"
          class="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
        >
          <div class="flex items-start gap-2">
            <UIcon
              name="i-lucide-alert-circle"
              class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
              size="16"
            />
            <div class="flex-1 min-w-0">
              <span
                class="block text-sm font-semibold text-red-800 dark:text-red-200 truncate"
              >
                {{ err.label }}
              </span>
              <span class="block text-xs text-red-600 dark:text-red-400 mt-0.5">
                {{ $t(err.reason || "checkout.bookable_unavailable") }}
              </span>
            </div>
          </div>
        </div>

        <!-- Valid Items -->
        <div
          v-for="(item, idx) in computedSummary.items"
          :key="idx"
          class="flex items-baseline justify-between text-sm md:text-base text-gray-700 dark:text-gray-200"
        >
          <span class="truncate pr-2">{{ item.label }}</span>
          <span v-if="item.amountEur > 0" class="tabular-nums whitespace-nowrap">
            {{ formatEur(item.amountEur) }}
          </span>
          <span v-else class="text-gray-400">-</span>
        </div>

        <div
          v-if="computedSummary.taxAmount > 0"
          class="flex items-baseline justify-between text-sm md:text-base text-gray-700 dark:text-gray-200"
        >
          <span>MwSt.</span>
          <span class="tabular-nums whitespace-nowrap">
            {{ formatEur(computedSummary.taxAmount) }}
          </span>
        </div>

        <div
          class="border-t border-gray-200 dark:border-gray-800 pt-3 flex items-baseline justify-between"
        >
          <span
            class="text-base md:text-lg font-bold text-gray-900 dark:text-white"
          >
            Gesamt
          </span>
          <span
              v-if="computedSummary.total > 0"
            class="text-base md:text-lg font-bold tabular-nums whitespace-nowrap text-primary dark:text-primary"
          >
            {{ formatEur(computedSummary.total) }}
          </span>
          <span v-else class="text-gray-400">Kostenlos</span>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped></style>
