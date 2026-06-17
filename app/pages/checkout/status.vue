<script setup>
import { useBookings } from "~/composables/api/useBookings.js";
import { useCheckout } from "~/composables/api/useCheckout.js";
import {
  effectiveBookingStatusI18nKey,
  BOOKING_STATUS_REASONS,
} from "~/utils/bookingStatus.js";

definePageMeta({
  layout: "checkout",
});

const POLL_INTERVAL_MS = 5000;
const POLL_WINDOW_MS = 60_000;
const KNOWN_PAYMENT_PROVIDER_LABELS = {
  invoice: "checkout.payment.providers.invoice.title",
  giroCockpit: "checkout.payment.providers.giroCockpit.title",
  pmPayment: "checkout.payment.providers.pmPayment.title",
  ePayBL: "checkout.payment.providers.ePayBL.title",
};

const route = useRoute();
const { t, te, locale } = useI18n();
const checkoutNavTab = useState("checkoutNavTab", () => "");

const bookableId = computed(() => String(route.query.bookableId || "").trim());
const bookingId = computed(() => String(route.query.bookingId || "").trim());
const tenantId = computed(() => String(route.query.tenantId || "").trim());

const { getStatus } = useBookings();
const { fetchBookable } = useCheckout();

const bookable = ref(null);
if (bookableId.value && tenantId.value) {
  try {
    bookable.value = await fetchBookable(bookableId.value, tenantId.value);
  } catch (error) {
    console.warn("Could not load bookable for checkout status:", error);
  }
}

const statusResponse = ref(null);
const statusPending = ref(false);
const statusError = ref(null);
const refreshError = ref(null);
const hasLoadedOnce = ref(false);
const isRefreshing = ref(false);
const lastUpdatedAt = ref(null);

const autoPollStartedAt = ref(null);
const autoPollAttempts = ref(0);
const autoPollExpired = ref(false);
const autoPollTick = ref(Date.now());
const paymentConfirmedByPolling = ref(false);

let autoPollTimer = null;
let autoPollClockTimer = null;

const isValid = computed(
  () => bookingId.value.length > 0 && tenantId.value.length > 0,
);

const envelopeOk = computed(
  () => !statusResponse.value || statusResponse.value.success !== false,
);

const bookingsFromApi = computed(() => {
  if (!isValid.value || !statusResponse.value) return [];
  const raw = statusResponse.value?.data?.bookings;
  return Array.isArray(raw) ? raw : [];
});

function syncCheckoutTab() {
  checkoutNavTab.value = {
    label: t("checkout.status.pageTitle"),
    url: route.fullPath,
  };
}

watch([() => route.fullPath, () => locale.value], syncCheckoutTab, {
  immediate: true,
});

function clearAutoPollTimer() {
  if (!import.meta.client || autoPollTimer == null) return;
  window.clearTimeout(autoPollTimer);
  autoPollTimer = null;
}

function startAutoPollClock() {
  if (!import.meta.client || autoPollClockTimer != null) return;
  autoPollClockTimer = window.setInterval(() => {
    autoPollTick.value = Date.now();
  }, 1000);
}

function stopAutoPollClock() {
  if (!import.meta.client || autoPollClockTimer == null) return;
  window.clearInterval(autoPollClockTimer);
  autoPollClockTimer = null;
}

function resetAutoPollingState() {
  clearAutoPollTimer();
  stopAutoPollClock();
  autoPollStartedAt.value = null;
  autoPollAttempts.value = 0;
  autoPollExpired.value = false;
  autoPollTick.value = Date.now();
  paymentConfirmedByPolling.value = false;
}

function normalizePaymentProviderId(value) {
  if (value === 1) return "invoice";

  const raw = String(value ?? "").trim();
  if (!raw) return "";
  if (raw === "1") return "invoice";

  const lowered = raw.toLowerCase();
  if (lowered === "invoice") return "invoice";
  if (lowered === "girocockpit") return "giroCockpit";
  if (lowered === "pmpayment") return "pmPayment";
  if (lowered === "epaybl") return "ePayBL";

  return raw;
}

function paymentProviderLabel(value) {
  const providerId = normalizePaymentProviderId(value);
  if (!providerId) return "";

  const translationKey = KNOWN_PAYMENT_PROVIDER_LABELS[providerId];
  if (translationKey && te(translationKey)) {
    return t(translationKey);
  }

  return providerId;
}

function isAutoPollingCandidate(booking) {
  const priceEur = Number(booking?.priceEur);
  const paymentProvider = normalizePaymentProviderId(booking?.paymentProvider);

  return (
    booking?.isCommitted === true &&
    booking?.isPayed === false &&
    booking?.isRejected === false &&
    Number.isFinite(priceEur) &&
    priceEur > 0 &&
    paymentProvider !== "invoice"
  );
}

const pendingAutoPollBookings = computed(() =>
  bookingsFromApi.value.filter((booking) => isAutoPollingCandidate(booking)),
);

const hasPendingAutoPollBookings = computed(
  () => pendingAutoPollBookings.value.length > 0,
);

const hasPaidAutoPollBookings = computed(() =>
  bookingsFromApi.value.some((booking) => {
    const priceEur = Number(booking?.priceEur);
    const paymentProvider = normalizePaymentProviderId(
      booking?.paymentProvider,
    );

    return (
      booking?.isCommitted === true &&
      booking?.isRejected === false &&
      booking?.isPayed === true &&
      Number.isFinite(priceEur) &&
      priceEur > 0 &&
      paymentProvider !== "invoice"
    );
  }),
);

const canAutoPoll = computed(
  () =>
    import.meta.client &&
    isValid.value &&
    envelopeOk.value &&
    hasPendingAutoPollBookings.value &&
    !autoPollExpired.value,
);

const isAutoPolling = computed(
  () => canAutoPoll.value && autoPollStartedAt.value != null,
);

const autoPollRemainingMs = computed(() => {
  if (!autoPollStartedAt.value) return POLL_WINDOW_MS;
  return Math.max(
    POLL_WINDOW_MS - (autoPollTick.value - autoPollStartedAt.value),
    0,
  );
});

const paymentConfirmedDuringPolling = computed(
  () => paymentConfirmedByPolling.value,
);

function scheduleAutoPollingIfNeeded() {
  clearAutoPollTimer();

  if (!canAutoPoll.value) {
    if (!hasPendingAutoPollBookings.value) {
      if (autoPollStartedAt.value != null && hasPaidAutoPollBookings.value) {
        paymentConfirmedByPolling.value = true;
      }
      clearAutoPollTimer();
      stopAutoPollClock();
      autoPollStartedAt.value = null;
      autoPollAttempts.value = 0;
      autoPollExpired.value = false;
      autoPollTick.value = Date.now();
    } else if (autoPollExpired.value) {
      stopAutoPollClock();
    }
    return;
  }

  if (!autoPollStartedAt.value) {
    autoPollStartedAt.value = Date.now();
    autoPollTick.value = autoPollStartedAt.value;
  }

  const elapsed = Date.now() - autoPollStartedAt.value;
  if (elapsed >= POLL_WINDOW_MS) {
    autoPollExpired.value = true;
    stopAutoPollClock();
    return;
  }

  startAutoPollClock();
  autoPollTimer = window.setTimeout(async () => {
    autoPollAttempts.value += 1;
    autoPollTick.value = Date.now();
    await loadStatus({ background: true });
  }, POLL_INTERVAL_MS);
}

async function loadStatus({ background = false, resetPolling = false } = {}) {
  if (!isValid.value) {
    resetAutoPollingState();
    statusResponse.value = null;
    statusError.value = null;
    refreshError.value = null;
    lastUpdatedAt.value = null;
    hasLoadedOnce.value = false;
    statusPending.value = false;
    isRefreshing.value = false;
    return;
  }

  if (resetPolling) {
    resetAutoPollingState();
  }

  const useBackgroundRefresh =
    background && hasLoadedOnce.value && statusResponse.value != null;

  if (useBackgroundRefresh) {
    isRefreshing.value = true;
    refreshError.value = null;
  } else {
    statusPending.value = true;
    statusError.value = null;
  }

  try {
    statusResponse.value = await getStatus(tenantId.value, bookingId.value);
    hasLoadedOnce.value = true;
    refreshError.value = null;
    lastUpdatedAt.value = Date.now();
  } catch (error) {
    if (useBackgroundRefresh && statusResponse.value != null) {
      refreshError.value = error;
    } else {
      statusError.value = error;
      statusResponse.value = null;
      hasLoadedOnce.value = true;
    }
  } finally {
    statusPending.value = false;
    isRefreshing.value = false;
    scheduleAutoPollingIfNeeded();
  }
}

watch(
  [tenantId, bookingId],
  async () => {
    resetAutoPollingState();
    statusResponse.value = null;
    statusError.value = null;
    refreshError.value = null;
    lastUpdatedAt.value = null;
    hasLoadedOnce.value = false;
    await loadStatus();
  },
  { immediate: true },
);

onUnmounted(() => {
  clearAutoPollTimer();
  stopAutoPollClock();

  if (checkoutNavTab.value?.url === route.fullPath) {
    checkoutNavTab.value = "";
  }
});

function statusDetailParts(statusKey) {
  const slug = String(statusKey || "").replace(/^status\./, "");
  const titleKey = `checkout.status.detail.${slug}.title`;
  const bodyKey = `checkout.status.detail.${slug}.body`;

  return {
    title: te(titleKey) ? t(titleKey) : t(statusKey),
    body: te(bodyKey) ? t(bodyKey) : "",
  };
}

function statusPresentation(statusKey) {
  switch (statusKey) {
    case "status.rejected":
      return {
        icon: "i-lucide-x-circle",
        badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        ring: "bg-red-100/80 dark:bg-red-900/40",
        iconClass: "text-red-600 dark:text-red-400",
      };
    case "status.awaiting_approval":
      return {
        icon: "i-lucide-clock-3",
        badge:
          "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
        ring: "bg-amber-100/80 dark:bg-amber-900/40",
        iconClass: "text-amber-600 dark:text-amber-400",
      };
    case "status.payment_expected":
      return {
        icon: "i-lucide-receipt-text",
        badge:
          "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-200",
        ring: "bg-primary-100/80 dark:bg-primary-900/40",
        iconClass: "text-primary-600 dark:text-primary-300",
      };
    case "status.paid_completed":
    case "status.confirmed_without_payment":
      return {
        icon: "i-lucide-check-circle-2",
        badge:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
        ring: "bg-emerald-100/80 dark:bg-emerald-900/40",
        iconClass: "text-emerald-600 dark:text-emerald-400",
      };
    default:
      return {
        icon: "i-lucide-info",
        badge: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        ring: "bg-gray-100 dark:bg-gray-800",
        iconClass: "text-gray-600 dark:text-gray-300",
      };
  }
}

function rowForBooking(booking) {
  const statusKey = effectiveBookingStatusI18nKey(booking);
  const success = booking.success !== false;
  const paymentProvider = normalizePaymentProviderId(booking.paymentProvider);
  const priceEur =
    booking.priceEur != null && !Number.isNaN(Number(booking.priceEur))
      ? Number(booking.priceEur)
      : null;

  let errorMessage = null;
  if (!success) {
    const reason =
      booking.reasonKey ||
      booking.reason ||
      booking.errorReason ||
      booking.statusReason;

    if (typeof reason === "string" && reason.startsWith("booking_status.")) {
      errorMessage = t(reason);
    } else if (
      typeof reason === "string" &&
      Object.values(BOOKING_STATUS_REASONS).includes(reason)
    ) {
      errorMessage = t(reason);
    } else if (typeof reason === "string" && reason.length > 0) {
      errorMessage = reason;
    } else {
      errorMessage = t("checkout.status.bookingStatusError");
    }
  }

  const detail = statusDetailParts(statusKey);

  return {
    id: String(booking.bookingId ?? booking.id ?? ""),
    statusKey,
    label: t(statusKey),
    detailTitle: detail.title,
    detailBody: detail.body,
    presentation: statusPresentation(statusKey),
    success,
    errorMessage,
    priceEur,
    isCommitted: booking?.isCommitted === true,
    isPayed: booking?.isPayed === true,
    isRejected: booking?.isRejected === true,
    paymentProvider,
    paymentLabel: paymentProviderLabel(booking.paymentProvider),
    isInvoicePayment: paymentProvider === "invoice",
    shouldPoll: isAutoPollingCandidate(booking),
    paymentStateLabel: booking?.isPayed
      ? t("checkout.status.paymentPaid")
      : t("checkout.status.paymentPending"),
    paymentStateClass: booking?.isPayed
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200"
      : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  };
}

const bookingRows = computed(() =>
  bookingsFromApi.value.map((booking) => rowForBooking(booking)),
);

const isSingleBookingView = computed(() => bookingRows.value.length === 1);

const singleBookingRow = computed(() =>
  isSingleBookingView.value ? bookingRows.value[0] : null,
);

const isAwaitingApproval = computed(
  () => singleBookingRow.value?.statusKey === "status.awaiting_approval",
);

const showThankYouBanner = computed(() => {
  const row = singleBookingRow.value;
  return row != null && !row.isRejected;
});

const showInvoiceMailHint = computed(() => {
  const row = singleBookingRow.value;
  if (!row) return false;
  return row.isCommitted && row.isInvoicePayment;
});

const showPaymentDetails = computed(() => {
  const row = singleBookingRow.value;
  if (!row) return false;
  return (
    row.priceEur != null &&
    row.priceEur > 0 &&
    (row.isCommitted || row.isPayed || row.paymentLabel)
  );
});

const summaryStats = computed(() => [
  {
    key: "total",
    label: t("checkout.status.summaryTotalLabel"),
    value: bookingRows.value.length,
  },
  {
    key: "openInvoice",
    label: t("checkout.status.summaryOpenInvoiceLabel"),
    value: pendingAutoPollBookings.value.length,
  },
  {
    key: "paid",
    label: t("checkout.status.summaryPaidLabel"),
    value: bookingRows.value.filter((row) => row.isPayed).length,
  },
]);

function formatMoneyEur(amount) {
  try {
    return new Intl.NumberFormat(locale.value === "de" ? "de-DE" : "en-GB", {
      style: "currency",
      currency: "EUR",
    }).format(amount);
  } catch {
    return `${amount} €`;
  }
}

function formatDateTime(value) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat(locale.value === "de" ? "de-DE" : "en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(value);
  } catch {
    return new Date(value).toLocaleString();
  }
}

async function handleManualRefresh() {
  await loadStatus({
    background: hasLoadedOnce.value && statusResponse.value != null,
    resetPolling: true,
  });
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-gray-950">
    <div class="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:px-8 lg:py-10">
      <header
        class="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
      >
        <div class="max-w-3xl">
          <div class="flex items-start gap-4">
            <div class="space-y-2">
              <h2
                class="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white truncate"
              >
                {{ $t("checkout.status.pageTitle") }}
              </h2>
            </div>
          </div>
        </div>

        <div class="text-sm text-gray-600 dark:text-gray-300 lg:text-right">
          <div class="flex items-center gap-2 lg:justify-end">
            <UIcon
              :name="
                isRefreshing || isAutoPolling
                  ? 'i-lucide-loader-2'
                  : 'i-lucide-refresh-cw'
              "
              :class="[
                'h-4 w-4 text-primary-500',
                isRefreshing || isAutoPolling ? 'animate-spin' : '',
              ]"
            />
            <span class="font-medium text-gray-900 dark:text-white">
              {{
                isRefreshing || isAutoPolling
                  ? $t("checkout.status.refreshingLabel")
                  : $t("checkout.status.lastUpdatedLabel")
              }}
            </span>
          </div>
          <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {{
              lastUpdatedAt
                ? formatDateTime(lastUpdatedAt)
                : $t("checkout.status.waitingForFirstUpdate")
            }}
          </p>
        </div>
      </header>

      <div class="mt-8 border-t border-gray-100 dark:border-gray-800" />

      <div
        v-if="showThankYouBanner"
        class="mt-5 px-10 p-4 rounded-xl bg-primary/20"
      >
        <h2
          class="mt-4 mb-2 text-xl font-semibold text-gray-900 dark:text-white md:text-2xl"
        >
          {{
            isAwaitingApproval
              ? $t("checkout.status.thankYouRequestTitle")
              : $t("checkout.status.thankYouTitle")
          }}
        </h2>

        <div class="mt-1">
          {{
            isAwaitingApproval
              ? $t("checkout.status.thankYouRequestBody")
              : $t("checkout.status.thankYouBody")
          }}
          <span v-if="showInvoiceMailHint">
            {{ " " }}{{ $t("checkout.status.invoiceMailHint") }}
          </span>
          <br >
          {{ $t("checkout.status.closeWindowHint") }}
        </div>
      </div>

      <div class="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div class="space-y-5">
          <template v-if="!isValid">
            <div
              class="rounded-2xl bg-gray-50 px-6 py-5 text-gray-700 dark:bg-gray-900/60 dark:text-gray-200"
            >
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white">
                {{ $t("checkout.status.invalidLinkTitle") }}
              </h2>
              <p
                class="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300"
              >
                {{ $t("checkout.status.invalidLinkBody") }}
              </p>
            </div>
          </template>

          <template v-else-if="statusPending && !hasLoadedOnce">
            <div
              class="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl bg-gray-50 p-6 text-center dark:bg-gray-900/60"
            >
              <UIcon
                name="i-lucide-loader-2"
                class="h-10 w-10 animate-spin text-primary-500"
              />
              <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                {{ $t("checkout.status.loading") }}
              </p>
            </div>
          </template>

          <template v-else-if="statusError">
            <div class="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
              <h2 class="text-lg font-semibold text-red-900 dark:text-red-100">
                {{ $t("checkout.status.loadErrorTitle") }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-red-700 dark:text-red-200">
                {{ $t("checkout.status.loadErrorBody") }}
              </p>
              <div class="mt-5">
                <UButton
                  color="primary"
                  variant="soft"
                  @click="handleManualRefresh"
                >
                  {{ $t("checkout.status.retryAction") }}
                </UButton>
              </div>
            </div>
          </template>

          <template v-else-if="!envelopeOk">
            <div class="rounded-2xl bg-red-50 p-6 dark:bg-red-950/30">
              <h2 class="text-lg font-semibold text-red-900 dark:text-red-100">
                {{ $t("checkout.status.apiFailedTitle") }}
              </h2>
              <p class="mt-2 text-sm leading-6 text-red-700 dark:text-red-200">
                {{ $t("checkout.status.apiFailedBody") }}
              </p>
            </div>
          </template>

          <template v-else>
            <div
              v-if="paymentConfirmedDuringPolling"
              class="rounded-2xl bg-emerald-50 p-5 dark:bg-emerald-950/20"
            >
              <p
                class="text-sm font-semibold text-emerald-900 dark:text-emerald-100"
              >
                {{ $t("checkout.status.paymentConfirmedTitle") }}
              </p>
              <p
                class="mt-1 text-sm leading-6 text-emerald-800 dark:text-emerald-200"
              >
                {{ $t("checkout.status.paymentConfirmedBody") }}
              </p>
            </div>

            <div
              v-if="refreshError"
              class="rounded-2xl bg-amber-50 p-4 dark:bg-amber-950/20"
            >
              <p class="text-sm font-medium text-amber-900 dark:text-amber-100">
                {{ $t("checkout.status.backgroundRefreshError") }}
              </p>
            </div>

            <div
              v-if="!bookingRows.length"
              class="rounded-2xl bg-gray-50 p-6 dark:bg-gray-900/60"
            >
              <p class="text-sm leading-6 text-gray-600 dark:text-gray-300">
                {{ $t("checkout.status.noBookingsInResponse") }}
              </p>
            </div>

            <div v-else-if="isSingleBookingView && singleBookingRow">
              <article
                class="rounded-md bg-gray-50 p-6 dark:bg-gray-900/60 md:p-8"
              >
                <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
                  <div class="min-w-0 flex-1">
                    <span
                      class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                      :class="singleBookingRow.presentation.badge"
                    >
                      <UIcon
                        :name="singleBookingRow.presentation.icon"
                        class="h-3.5 w-3.5"
                      />
                      {{ singleBookingRow.label }}
                    </span>

                    <h2
                      class="mt-4 text-xl font-semibold text-gray-900 dark:text-white md:text-2xl"
                    >
                      {{ singleBookingRow.detailTitle }}
                    </h2>

                    <p
                      v-if="singleBookingRow.detailBody"
                      class="mt-3 text-sm leading-7 text-gray-600 dark:text-gray-300"
                    >
                      {{ singleBookingRow.detailBody }}
                    </p>
                    <p
                      v-if="
                        !singleBookingRow.success &&
                        singleBookingRow.errorMessage
                      "
                      class="mt-3 text-sm leading-6 text-red-600 dark:text-red-400"
                    >
                      {{ singleBookingRow.errorMessage }}
                    </p>

                    <p
                      v-if="singleBookingRow.id"
                      class="mt-5 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.singleBookingReference") }}:
                      <span
                        class="font-mono font-semibold text-gray-700 dark:text-gray-200"
                      >
                        #{{ singleBookingRow.id }}
                      </span>
                    </p>

                    <p
                      v-if="bookable && bookable.title"
                      class="mt-5 text-sm text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.bookableTitle") }}:
                      <span
                        class="font-mono font-semibold text-gray-700 dark:text-gray-200"
                      >
                        {{ bookable.title }}
                      </span>
                    </p>
                  </div>
                </div>

                <dl
                  v-if="showPaymentDetails"
                  class="mt-8 grid gap-x-8 gap-y-4 border-t border-gray-200/80 pt-6 dark:border-gray-800 sm:grid-cols-3"
                >
                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.paymentProviderLabel") }}
                    </dt>
                    <dd
                      class="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ singleBookingRow.paymentLabel || "—" }}
                    </dd>
                  </div>

                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.paymentStateLabel") }}
                    </dt>
                    <dd class="mt-1">
                      <span
                        class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
                        :class="singleBookingRow.paymentStateClass"
                      >
                        {{ singleBookingRow.paymentStateLabel }}
                      </span>
                    </dd>
                  </div>

                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.amountLabel") }}
                    </dt>
                    <dd
                      class="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{
                        singleBookingRow.priceEur != null &&
                        singleBookingRow.priceEur > 0
                          ? formatMoneyEur(singleBookingRow.priceEur)
                          : "—"
                      }}
                    </dd>
                  </div>
                </dl>

                <div
                  v-if="singleBookingRow.shouldPoll"
                  class="mt-6 rounded-xl bg-primary-50/70 px-4 py-3 text-sm text-primary-900 dark:bg-primary-950/20 dark:text-primary-100"
                >
                  <div class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-refresh-cw"
                      :class="[
                        'mt-0.5 h-4 w-4 shrink-0',
                        isAutoPolling ? 'animate-spin' : '',
                      ]"
                    />
                    <p class="leading-6">
                      {{
                        isAutoPolling
                          ? $t("checkout.status.invoicePollingHintActive")
                          : $t("checkout.status.invoicePollingHintIdle")
                      }}
                    </p>
                  </div>
                </div>
              </article>
            </div>

            <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
              <div
                v-if="bookable && bookable.title"
                class="grid pb-6 text-sm font-medium tracking-wide text-gray-500 dark:text-gray-400"
              >
                {{ $t("checkout.status.bookableTitle") }}:
                <div
                  class="mt-1 text-md font-semibold text-gray-900 dark:text-white"
                >
                  {{ bookable.title }}
                </div>
              </div>
              <article
                v-for="row in bookingRows"
                :key="row.id || row.statusKey"
                class="py-6 first:pt-0 last:pb-0"
              >
                <div
                  class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex flex-wrap items-center gap-2">
                      <span
                        class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        #{{ row.id || "—" }}
                      </span>
                      <span
                        class="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                        :class="row.presentation.badge"
                      >
                        <UIcon
                          :name="row.presentation.icon"
                          class="h-3.5 w-3.5"
                        />
                        {{ row.label }}
                      </span>
                    </div>

                    <h2
                      class="mt-4 text-lg font-semibold text-gray-900 dark:text-white"
                    >
                      {{ $t("checkout.status.referenceLabel") }}
                      {{ row.id || "—" }}
                    </h2>

                    <p
                      v-if="!row.success && row.errorMessage"
                      class="mt-2 text-sm leading-6 text-red-600 dark:text-red-400"
                    >
                      {{ row.errorMessage }}
                    </p>
                  </div>
                </div>

                <dl class="mt-5 grid gap-x-8 gap-y-4 sm:grid-cols-3">
                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.paymentProviderLabel") }}
                    </dt>
                    <dd
                      class="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ row.paymentLabel || "—" }}
                    </dd>
                  </div>

                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.paymentStateLabel") }}
                    </dt>
                    <dd
                      class="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{ row.paymentStateLabel }}
                    </dd>
                  </div>

                  <div class="space-y-1">
                    <dt
                      class="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400"
                    >
                      {{ $t("checkout.status.amountLabel") }}
                    </dt>
                    <dd
                      class="mt-1 text-sm font-semibold text-gray-900 dark:text-white"
                    >
                      {{
                        row.priceEur != null && row.priceEur > 0
                          ? formatMoneyEur(row.priceEur)
                          : "—"
                      }}
                    </dd>
                  </div>
                </dl>

                <div
                  v-if="row.shouldPoll"
                  class="mt-4 rounded-xl bg-primary-50/70 px-4 py-3 text-sm text-primary-900 dark:bg-primary-950/20 dark:text-primary-100"
                >
                  <div class="flex items-start gap-2">
                    <UIcon
                      name="i-lucide-refresh-cw"
                      :class="[
                        'mt-0.5 h-4 w-4 shrink-0',
                        isAutoPolling ? 'animate-spin' : '',
                      ]"
                    />
                    <p class="leading-6">
                      {{
                        isAutoPolling
                          ? $t("checkout.status.invoicePollingHintActive")
                          : $t("checkout.status.invoicePollingHintIdle")
                      }}
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </template>
        </div>

        <aside class="lg:sticky lg:top-6">
          <div class="rounded-lg bg-gray-50 px-5 py-6 dark:bg-gray-900/60">
            <div v-if="!isSingleBookingView">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                {{ $t("checkout.review.overviewCardTitle") }}
              </p>

              <div class="mt-4 space-y-3">
                <div
                  v-for="stat in summaryStats"
                  :key="stat.key"
                  class="flex items-center justify-between py-3"
                >
                  <span class="text-sm text-gray-600 dark:text-gray-300">
                    {{ stat.label }}
                  </span>
                  <span
                    class="text-lg font-semibold text-gray-900 dark:text-white"
                  >
                    {{ stat.value }}
                  </span>
                </div>
              </div>

              <p
                class="mt-4 text-xs leading-5 text-gray-500 dark:text-gray-400"
              >
                {{ $t("checkout.status.lastUpdatedLabel") }}:
                {{ lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "—" }}
              </p>
            </div>

            <p
              v-else
              class="text-xs leading-5 text-gray-500 dark:text-gray-400"
            >
              {{ $t("checkout.status.lastUpdatedLabel") }}:
              {{ lastUpdatedAt ? formatDateTime(lastUpdatedAt) : "—" }}
            </p>

            <div
              :class="
                isSingleBookingView
                  ? ''
                  : 'mt-6 border-t border-gray-200 pt-6 dark:border-gray-800'
              "
            >
              <div class="mt-4 space-y-3">
                <UButton
                  color="neutral"
                  variant="subtle"
                  block
                  :loading="statusPending || isRefreshing"
                  icon="i-lucide-refresh-cw"
                  class="cursor-pointer"
                  @click="handleManualRefresh"
                >
                  {{ $t("checkout.status.manualRefreshAction") }}
                </UButton>

                <UButton color="primary" block to="/" icon="i-lucide-home">
                  {{ $t("common.home") }}
                </UButton>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>
