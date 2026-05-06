<script setup>
import { useCheckout } from "~/composables/api/useCheckout.js";
import { useTenants } from "~/composables/api/useTenants.js";
import AdditionalBookablesSelector from "~/components/checkout/AdditionalBookablesSelector.vue";
import InputTimePeriodSlots from "~/components/inputs/InputTimePeriodSlots.vue";
import InputFreeTimeSelection from "~/components/inputs/InputFreeTimeSelection.vue";
import InputWeekSelection from "~/components/inputs/InputWeekSelection.vue";
import InputMonthSelection from "~/components/inputs/InputMonthSelection.vue";
import PriceSummaryBar from "~/components/checkout/PriceSummaryBar.vue";
import { Splitpanes, Pane } from 'splitpanes'
import 'splitpanes/dist/splitpanes.css'



definePageMeta({
  layout: "checkout",
});

const route = useRoute();
const bookableID = route.params.bookableID;
const tenantID = route.query.tenantId;

const { fetchBookable } = useCheckout();
const { fetchTenant } = useTenants();

const isLoading = ref(true);

const { data, error } = await useAsyncData(
  `checkout-${bookableID}-${tenantID}`,
  async () => {
    if (!bookableID || !tenantID) return null;
    try {
      const [leadBookable, tenant] = await Promise.all([
        fetchBookable(bookableID, tenantID),
        fetchTenant(tenantID),
      ]);

      const additionalIds = leadBookable?.checkoutBookableIds || [];
      const additionalBookables = await Promise.all(
        additionalIds.map(async ({ bookableId, mandatory }) => ({
          item: await fetchBookable(bookableId, tenantID),
          mandatory,
        }))
      );

      return { leadBookable, tenant, additionalBookables };
    } finally {
      isLoading.value = false;
    }
  },
  { server: false, lazy: true }
);

if (error.value) {
  console.error("Error loading checkout data:", error.value);
}

const leadBookable = computed(() => data.value?.leadBookable || null);
const tenant = computed(() => data.value?.tenant || null);

// --- Type-Label für die NavigationBar bereitstellen ------------------------
const TYPE_LABELS = {
  room: "Raumbuchung",
  resource: "Ressourcen-Buchung",
  ticket: "Ticketbuchung",
  event: "Eventbuchung",
};

const checkoutNavTab = useState("checkoutNavTab", () => {});

watch(
  leadBookable,
  (b) => {
    const type = b?.type;
    checkoutNavTab.value = TYPE_LABELS[type] || type || "";

    const route = useRoute();
    const bookableID = route.params.bookableID;
    const tenantID = route.query.tenantId;

    const label = TYPE_LABELS[type] || type || "";
    const url = `/checkout/${bookableID}?tenantId=${tenantID}`;
    checkoutNavTab.value = { label, url };
  },
  { immediate: true }
);

onUnmounted(() => {
  checkoutNavTab.value = "";
});
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const additionalBookables = computed(
  () => data.value?.additionalBookables || []
);

const checkoutID = ref(null);
const summary = ref({ items: [], taxAmount: 0, total: 0, errors: [] });
const isValidating = ref(false);
const validationErrors = ref({});

const selectedTimePeriod = ref({ start: null, end: null });
const selectedAdditionalBookables = ref([]);

// --- Mengen pro Bookable ----------------------------------------------------
const amounts = ref({});

watch(
  leadBookable,
  (b) => {
    if (b?.id && !amounts.value[b.id]) {
      amounts.value[b.id] = 1;
    }
  },
  { immediate: true }
);

watch(
  selectedAdditionalBookables,
  (ids) => {
    for (const id of ids) {
      if (!amounts.value[id]) {
        amounts.value[id] = 1;
      }
    }
  },
  { deep: true }
);

function handleAmountUpdate({ id, amount }) {
  if (amount <= 0 && id !== bookableID) {
    // Abwählen: aus der Additional-Selektion und den Mengen entfernen
    selectedAdditionalBookables.value = selectedAdditionalBookables.value.filter(
      (bid) => bid !== id
    );
    delete amounts.value[id];
  } else {
    amounts.value[id] = amount;
  }
}

const { validateBookable } = useCheckout();

let validationToken = 0;

async function validateAll() {
  const { start, end } = selectedTimePeriod.value;
  if (!start || !end || end <= start) {
    summary.value = { items: [], taxAmount: 0, total: 0, errors: [] };
    validationErrors.value = {};
    checkoutID.value = null;
    return;
  }

  const myToken = ++validationToken;
  isValidating.value = true;
  validationErrors.value = {};

  try {
    const targets = [
      { id: bookableID, isLead: true },
      ...selectedAdditionalBookables.value.map((id) => ({
        id,
        isLead: false,
      })),
    ];

    const results = await Promise.all(
      targets.map(({ id, isLead }) =>
        validateBookable({
          bookableID: id,
          tenantID,
          amount: amounts.value[id] || 1,
          start,
          end,
        })
          .then((res) => ({ id, isLead, res }))
          .catch((err) => ({ id, isLead, error: err }))
      )
    );

    if (myToken !== validationToken) return;

    const items = [];
    let taxAmount = 0;
    let total = 0;
    let newCheckoutId = null;
    const errors = [];
    const errorMap = {};

    for (const { id, isLead, res, error } of results) {
      const label = isLead
        ? leadBookable.value?.title
        : additionalBookables.value.find((b) => b.item.id === id)?.item.title ||
          "Zusatzbuchung";

      if (error) {
        const reason = "checkout.unknown_error";
        errorMap[id] = { reason, error, isLead };
        errors.push({ id, isLead, label, reason, error });
        continue;
      }

      if (!res?.success) {
        const errorReason = res?.error?.reason || "checkout.unknown_error";
        const errorDetails = res?.error?.params || {};
        errorMap[id] = { reason: errorReason, params: errorDetails, isLead };
        errors.push({
          id,
          isLead,
          label,
          reason: errorReason,
          params: errorDetails,
        });
        continue;
      }

      const { userPriceEur, userGrossPriceEur } = res.data;
      newCheckoutId = res.checkoutId;

      items.push({ id, label, amountEur: userPriceEur });
      taxAmount += userGrossPriceEur - userPriceEur;
      total += userGrossPriceEur;
    }

    validationErrors.value = errorMap;
    summary.value = { items, taxAmount, total, errors };
    checkoutID.value = newCheckoutId;
  } finally {
    if (myToken === validationToken) isValidating.value = false;
  }
}

let debounceTimer = null;
function scheduleValidation() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(validateAll, 200);
}

watch([selectedTimePeriod, selectedAdditionalBookables, amounts], scheduleValidation, {
  deep: true,
});

const isScheduleRelated = computed(
  () => leadBookable.value?.isScheduleRelated === true
);

const isTimePeriodRelated = computed(
  () => leadBookable.value?.isTimePeriodRelated === true
);

const isLongRangeWeek = computed(() => {
  const b = leadBookable.value;
  return (
    b?.isLongRange === true && b?.longRangeOptions?.type === "week"
  );
});

const isLongRangeMonth = computed(() => {
  const b = leadBookable.value;
  return (
    b?.isLongRange === true && b?.longRangeOptions?.type === "month"
  );
});

const longRangeMonthPrice = computed(() => {
  const categories = leadBookable.value?.priceCategories || [];
  if (categories.length === 0) return null;

  const internal = categories.filter(
    (c) => !c.external || (c.external && c.unit !== "service-fee"),
  );
  const withoutHolidays = internal.filter(
    (c) => !c.holidays || c.holidays.length === 0,
  );
  const prices = withoutHolidays
    .map((c) => c.priceEur)
    .filter((p) => p !== null && p !== undefined);

  if (prices.length === 0) return null;
  return Math.min(...prices);
});

const longRangeWeekPrice = computed(() => {
  const categories = leadBookable.value?.priceCategories || [];
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
});

const bookableTimePeriods = computed(
  () => leadBookable.value?.timePeriods || []
);

const hasValidTimePeriod = computed(
  () =>
    !!selectedTimePeriod.value?.start &&
    !!selectedTimePeriod.value?.end &&
    selectedTimePeriod.value.end > selectedTimePeriod.value.start
);

const needsTimePeriodSelection = computed(() => {
  const b = leadBookable.value;
  if (!b) return false;
  const requiresPeriod =
    b.isScheduleRelated === true ||
    b.isTimePeriodRelated === true ||
    b.isLongRange === true;
  const noPeriodSelected =
    !selectedTimePeriod.value?.start || !selectedTimePeriod.value?.end;
  return requiresPeriod && noPeriodSelected;
});

// --- Stepper ---------------------------------------------------------------
const currentStep = ref(1);

const steps = [
  {
    key: "period",
    title: "Zeitraum & Extras",
    nextLabel: "Weiter zu Daten",
  },
  {
    key: "data",
    title: "Daten eingeben",
    nextLabel: "Weiter zur Bestätigung",
  },
  {
    key: "confirm",
    title: "Bestätigung",
    nextLabel: "Buchung abschließen",
  },
];

const hasValidationErrors = computed(
  () => Object.keys(validationErrors.value).length > 0
);
const leadBookableError = computed(
  () => validationErrors.value[bookableID] || null
);

const canGoNext = computed(() => {
  if (currentStep.value !== 1) return true;
  if (
    !isTimePeriodRelated.value &&
    !isScheduleRelated.value &&
    !isLongRangeWeek.value &&
    !isLongRangeMonth.value
  )
    return true;
  if (!hasValidTimePeriod.value) return false;
  if (hasValidationErrors.value) return false;
  if (isValidating.value) return false;
  return true;
});

function handleFinish() {
  console.log("Buchung abschließen", {
    timePeriod: selectedTimePeriod.value,
  });
}
</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950 w-full min-h-screen">
    <!-- Loading / Empty State -->
    <div v-if="isLoading" class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <UIcon
          size="48"
          name="i-lucide-loader-2"
          class="text-gray-400 mb-4 animate-spin"
        />
        <p class="text-gray-500">{{ $t("common.loading") }}</p>
      </div>
    </div>

    <div
      v-else-if="!leadBookable"
      class="flex items-center justify-center min-h-screen"
    >
      <div class="text-center">
        <UIcon
          size="48"
          name="i-lucide-shopping-cart"
          class="text-gray-400 mb-4"
        />
        <p class="text-gray-500">{{ $t("checkout.noBookable") }}</p>
      </div>
    </div>

    <!-- Main Layout -->
    <div v-else class="flex flex-col lg:flex-row min-h-screen">
      <!-- LEFT: Bookable Overview + Prices -->
      <div class="flex-1 p-4 md:p-6 lg:p-10 lg:shrink-0 flex flex-col">
        <CheckoutBookableSidebar
          :lead-bookable="leadBookable"
          :tenant="tenant"
        />

        <!-- Spacer -->
        <div class="flex-1" />

        <!-- Price Summary  -->
        <div class="sticky bottom-4 md:bottom-6 mt-6 z-10">
          <PriceSummaryBar
            :summary="summary"
            :selected-time-period="selectedTimePeriod"
            :needs-time-period-selection="needsTimePeriodSelection"
            :is-validating="isValidating"
            :amounts="amounts"
            :lead-bookable-id="bookableID"
            @update:amount="handleAmountUpdate"
          />
        </div>
      </div>
      <!-- RIGHT: Checkout Flow -->
      <main class="flex-3 min-w-0 bg-white dark:bg-gray-900 p-6 md:p-8 lg:p-10">
        <AppStepper
          v-model="currentStep"
          :steps="steps"
          :can-go-next="canGoNext"
          @finish="handleFinish"
        >
          <template #step-objects>
            <p class="text-gray-500 dark:text-gray-400">
              Hier kommt die Objektauswahl rein.
            </p>
          </template>

          <template #step-period>
            <div class="space-y-8">
              <!-- Lead bookable error -->
              <div
                v-if="leadBookableError"
                class="flex items-start gap-3 p-4 rounded-xl border-2 border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950"
              >
                <UIcon
                  name="i-lucide-alert-triangle"
                  class="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5"
                  size="20"
                />
                <div class="flex-1">
                  <p class="font-semibold text-red-800 dark:text-red-200">
                    {{ leadBookable?.title }}
                  </p>
                  <p class="text-sm text-red-700 dark:text-red-300 mt-1">
                    {{ $t(leadBookableError.reason) }}
                  </p>
                  <p
                    v-if="leadBookableError.params?.remaining !== undefined"
                    class="text-xs text-red-600 dark:text-red-400 mt-1"
                  >
                    {{
                      $t("checkout.errors.capacityInfo", {
                        remaining: leadBookableError.params.remaining,
                        total: leadBookableError.params.totalCapacity,
                      })
                    }}
                  </p>
                </div>
              </div>

              <Splitpanes class="checkout-splitpanes">
                <Pane :size="65" :min-size="35">
                  <div class="pr-0 lg:pr-4">
                    <InputFreeTimeSelection
                      v-if="isScheduleRelated"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                    />

                    <InputTimePeriodSlots
                      v-else-if="isTimePeriodRelated"
                      v-model="selectedTimePeriod"
                      :time-periods="bookableTimePeriods"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                    />

                    <InputWeekSelection
                      v-else-if="isLongRangeWeek"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :price-eur="longRangeWeekPrice"
                    />

                    <InputMonthSelection
                      v-else-if="isLongRangeMonth"
                      v-model="selectedTimePeriod"
                      :tenant-id="tenantID"
                      :bookable-id="bookableID"
                      :price-eur="longRangeMonthPrice"
                    />

                    <p v-else class="text-gray-500 dark:text-gray-400">
                      Hier kommen Datum, Uhrzeit &amp; Zusatzobjekte rein.
                    </p>
                  </div>
                </Pane>

                <Pane v-if="additionalBookables.length > 0" :size="35" :min-size="20" class="overflow-hidden">
                  <div class="pl-0 lg:pl-4">
                    <AdditionalBookablesSelector
                      v-if="additionalBookables.length > 0"
                      v-model="selectedAdditionalBookables"
                      :items="additionalBookables"
                      :validation-errors="validationErrors"
                    />
                  </div>
                </Pane>
              </Splitpanes>
            </div>
          </template>

          <template #step-data>
            <p class="text-gray-500 dark:text-gray-400">
              Hier kommen die Kontaktdaten rein.
            </p>
          </template>

          <template #step-confirm>
            <p class="text-gray-500 dark:text-gray-400">
              Hier kommt die finale Bestätigung rein.
            </p>
          </template>
        </AppStepper>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* ── Splitpanes: Splitter Styling ── */
.checkout-splitpanes :deep(.splitpanes__splitter) {
  width: 9px;
  border: none;
  background-color: transparent;
  position: relative;
  cursor: col-resize;
  transition: background-color 0.2s ease;
}

/* Visible drag indicator line */
.checkout-splitpanes :deep(.splitpanes__splitter::before) {
  content: '';
  position: absolute;
  top: 0%;
  bottom: 0%;
  left: 50%;
  width: 2px;
  transform: translateX(-50%);
  background-color: #d1d5db;
  border-radius: 9999px;
  transition: background-color 0.2s ease, width 0.2s ease;
}

.checkout-splitpanes :deep(.splitpanes__splitter:hover::before) {
  background-color: var(--color-primary-500, #6366f1);
  width: 3px;
}

/* Dark mode splitter */
:root.dark .checkout-splitpanes :deep(.splitpanes__splitter::before) {
  background-color: #4b5563;
}

:root.dark .checkout-splitpanes :deep(.splitpanes__splitter:hover::before) {
  background-color: var(--color-primary-400, #818cf8);
}

/* ── Responsive: stack vertically on small screens ── */
@media (max-width: 1023px) {
  .checkout-splitpanes {
    flex-direction: column !important;
  }

  .checkout-splitpanes :deep(.splitpanes__splitter) {
    display: none !important;
  }

  .checkout-splitpanes :deep(.splitpanes__pane) {
    width: 100% !important;
    max-width: 100% !important;
    flex: none !important;
    padding-top: 1rem;
  }

  .checkout-splitpanes :deep(.splitpanes__pane:first-child) {
    padding-top: 0;
  }
}
</style>
