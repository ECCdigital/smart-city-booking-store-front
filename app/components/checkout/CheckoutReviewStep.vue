<script setup>
import { useCheckout } from "~/composables/api/useCheckout.js";

const COUPON_ROW_ID = "__coupon__";

const props = defineProps({
  summary: {
    type: Object,
    default: () => ({ items: [], taxAmount: 0, total: 0, errors: [] }),
  },
  selectedTimePeriod: {
    type: Object,
    default: () => ({ start: null, end: null }),
  },
  contact: {
    type: Object,
    required: true,
  },
  contactFieldKeys: {
    type: Array,
    default: () => [],
  },
  customerComment: {
    type: String,
    default: "",
  },
  showComment: {
    type: Boolean,
    default: false,
  },
  paymentProviders: {
    type: Array,
    default: () => [],
  },
  selectedPaymentProviderId: {
    type: String,
    default: null,
  },
  showPaymentSummary: {
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
  enableCoupons: {
    type: Boolean,
    default: false,
  },
  hasFreeBookingOption: {
    type: Boolean,
    default: false,
  },
  tenantId: {
    type: String,
    default: null,
  },
  customFieldRows: {
    type: Array,
    default: () => [],
  },
  isValidating: {
    type: Boolean,
    default: false,
  },
  showPeriodSummary: {
    type: Boolean,
    default: true,
  },
  selectionSectionTitle: {
    type: String,
    default: null,
  },
  showSelectionEdit: {
    type: Boolean,
    default: true,
  },
  stepCurrent: {
    type: Number,
    default: 1,
  },
  stepTotal: {
    type: Number,
    default: 1,
  },
  canSubmit: {
    type: Boolean,
    default: true,
  },
  isSubmitting: {
    type: Boolean,
    default: false,
  },
  hasPaymentStep: {
    type: Boolean,
    default: false,
  },
  requiresManualApproval: {
    type: Boolean,
    default: false,
  },
  groupBookingAttempts: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["finish", "back", "edit"]);

const appliedCoupon = defineModel("appliedCoupon", {
  type: String,
  default: null,
});

const appliedCouponDetails = defineModel("appliedCouponDetails", {
  type: Object,
  default: null,
});

const bookWithPrice = defineModel("bookWithPrice", {
  type: Boolean,
  default: true,
});

const { t, te, locale } = useI18n();
const { redeemCoupon } = useCheckout();

const couponDraft = ref("");
const couponError = ref("");
const couponApplying = ref(false);

const KNOWN_PROVIDER_IDS = ["giroCockpit", "pmPayment", "ePayBL", "invoice"];

function couponErrorReasonToKey(reason) {
  if (!reason || typeof reason !== "string") return null;
  const suffix = reason.startsWith("coupon.")
    ? reason.slice("coupon.".length)
    : reason;
  return `checkout.coupon.errors.${suffix}`;
}

function messageForCouponError(apiError) {
  const reason = apiError?.reason;
  const params =
    apiError?.params && typeof apiError.params === "object"
      ? apiError.params
      : {};
  const key = couponErrorReasonToKey(reason);
  if (key && te(key)) {
    return t(key, params);
  }
  if (reason && te(`checkout.coupon.errors.${reason}`)) {
    return t(`checkout.coupon.errors.${reason}`, params);
  }
  return t("checkout.review.couponInvalid");
}

function parseRedeemPayloadFromFetchError(err) {
  const data = err?.data;
  if (
    data &&
    typeof data === "object" &&
    data.success === false &&
    data.error
  ) {
    return data;
  }
  return null;
}

watch(
  appliedCoupon,
  (code) => {
    if (code) {
      couponDraft.value = code;
    } else {
      appliedCouponDetails.value = null;
    }
  },
  { immediate: true },
);

function formatEur(value) {
  if (value === null || value === undefined) return "–";
  return (
    value.toLocaleString(locale.value === "de" ? "de-DE" : "en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + " €"
  );
}

const redeemDiscountLabel = computed(() => {
  const meta = appliedCouponDetails.value;
  if (!meta || meta.discount == null || Number.isNaN(Number(meta.discount))) {
    return null;
  }
  const d = Number(meta.discount);
  const type = String(meta.type || "").toLowerCase();
  if (type === "percentage") {
    return t("checkout.review.couponDiscountPercent", { value: d });
  }
  if (type === "fixed") {
    return t("checkout.review.couponDiscountFixed", { value: formatEur(d) });
  }
  return null;
});

function formatDate(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(locale.value === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateLong(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleDateString(locale.value === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString(locale.value === "de" ? "de-DE" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

const formattedTimeRange = computed(() => {
  const { start, end } = props.selectedTimePeriod || {};
  if (!start || !end) return null;
  const startDate = new Date(start);
  const endDate = new Date(end);
  const sameDay = startDate.toDateString() === endDate.toDateString();
  if (sameDay) {
    return `${formatTime(start)} – ${formatTime(end)}`;
  }
  return `${formatDate(start)}, ${formatTime(start)} – ${formatDate(
    end,
  )}, ${formatTime(end)}`;
});

const summaryItemsNoCoupon = computed(() =>
  (props.summary?.items || []).filter((row) => row?.id !== COUPON_ROW_ID),
);

const leadSummaryRow = computed(() => {
  const id = props.leadBookableId;
  if (!id) return summaryItemsNoCoupon.value[0] || null;
  return summaryItemsNoCoupon.value.find((r) => r.id === id) || null;
});

const addonSummaryRows = computed(() => {
  const id = props.leadBookableId;
  const rows = summaryItemsNoCoupon.value;
  if (!id) return rows.slice(1);
  return rows.filter((r) => r.id !== id);
});

function contactLabel(key) {
  const map = {
    firstName: "common.firstName",
    lastName: "common.lastName",
    email: "common.email",
    phone: "common.phone",
    company: "common.company",
    address: "common.address",
    zipCode: "common.zipCode",
    city: "common.city",
  };
  const path = map[key];
  return path ? t(path) : key;
}

const contactReviewRows = computed(() => {
  const keys = props.contactFieldKeys;
  const c = props.contact || {};
  const rows = [];
  const used = new Set();

  const fn = String(c.firstName || "").trim();
  const ln = String(c.lastName || "").trim();
  if ((keys.includes("firstName") || keys.includes("lastName")) && (fn || ln)) {
    rows.push({
      key: "name",
      label: t("checkout.review.fullNameLabel"),
      value: [fn, ln].filter(Boolean).join(" "),
    });
    used.add("firstName");
    used.add("lastName");
  }

  const addr = String(c.address || "").trim();
  const zip = String(c.zipCode || "").trim();
  const city = String(c.city || "").trim();
  if (
    keys.includes("address") ||
    keys.includes("zipCode") ||
    keys.includes("city")
  ) {
    if (addr || zip || city) {
      const lines = [];
      if (addr) lines.push(addr);
      const line2 = [zip, city].filter(Boolean).join(" ");
      if (line2) lines.push(line2);
      rows.push({
        key: "addressBlock",
        label: t("common.completeAddress"),
        value: lines.join("\n"),
      });
      used.add("address");
      used.add("zipCode");
      used.add("city");
    }
  }

  const ordered = ["email", "phone", "company"];
  for (const key of ordered) {
    if (!keys.includes(key) || used.has(key)) continue;
    const v = c[key];
    if (v != null && String(v).trim() !== "") {
      rows.push({ key, label: contactLabel(key), value: String(v).trim() });
      used.add(key);
    }
  }

  for (const key of keys) {
    if (used.has(key)) continue;
    const v = c[key];
    if (v != null && String(v).trim() !== "") {
      rows.push({ key, label: contactLabel(key), value: String(v).trim() });
    }
  }

  return rows;
});

const paymentLabel = computed(() => {
  if (!props.showPaymentSummary || !props.selectedPaymentProviderId)
    return null;
  const id = String(props.selectedPaymentProviderId).trim();
  const p = props.paymentProviders.find((x) => x?.id === id);
  if (!p) return id;
  if (KNOWN_PROVIDER_IDS.includes(id)) {
    return t(`checkout.payment.providers.${id}.title`);
  }
  return (p.title && String(p.title).trim()) || id;
});

const paymentHint = computed(() => {
  if (!props.showPaymentSummary || !props.selectedPaymentProviderId)
    return null;
  const id = String(props.selectedPaymentProviderId).trim();
  if (KNOWN_PROVIDER_IDS.includes(id)) {
    return t(`checkout.payment.providers.${id}.description`);
  }
  const online = id !== "invoice";
  return online
    ? t("checkout.payment.fallbackOnlineDescription")
    : t("checkout.payment.fallbackInvoiceDescription");
});

function amountForItem(id) {
  const n = Number(props.amounts?.[id]);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function displayPriceForSummaryRow(row) {
  if (row.priceDisplayEur != null) return row.priceDisplayEur;
  if (row.amountEur != null) return row.amountEur;
  return null;
}

function displayOriginalPriceForSummaryRow(row) {
  if (row.originalAmountEur != null) return row.originalAmountEur;
  return null;
}

function hasOriginalPriceForSummaryRow(row) {
  const original = displayOriginalPriceForSummaryRow(row);
  const current = displayPriceForSummaryRow(row);
  return original != null && current != null && original > current;
}

function bookingLineSubtitle(row) {
  const qty = amountForItem(row.id);
  const gross = displayPriceForSummaryRow(row);
  if (gross == null) return null;
  const unit = qty > 1 ? gross / qty : gross;
  return t("checkout.review.lineQtyPrice", {
    qty,
    price: formatEur(unit),
  });
}

async function applyCoupon() {
  couponError.value = "";
  const code = String(couponDraft.value || "").trim();
  if (!code) {
    couponError.value = t("checkout.review.couponRequired");
    return;
  }
  if (!props.tenantId) return;

  couponApplying.value = true;
  try {
    const result = await redeemCoupon({
      tenantID: props.tenantId,
      couponCode: code,
    });

    if (result?.success === true) {
      appliedCouponDetails.value =
        result.data && typeof result.data === "object" ? result.data : null;
      appliedCoupon.value = code;
      return;
    }

    if (result?.success === false && result.error) {
      couponError.value = messageForCouponError(result.error);
      return;
    }

    couponError.value = t("checkout.review.couponInvalid");
  } catch (err) {
    const fromBody = parseRedeemPayloadFromFetchError(err);
    if (fromBody?.error) {
      couponError.value = messageForCouponError(fromBody.error);
      return;
    }
    const msg =
      err?.statusMessage || err?.data?.statusMessage || err?.message || "";
    couponError.value = msg ? String(msg) : t("checkout.review.couponInvalid");
  } finally {
    couponApplying.value = false;
  }
}

function removeCoupon() {
  appliedCoupon.value = null;
  appliedCouponDetails.value = null;
  couponDraft.value = "";
  couponError.value = "";
}

function onFinish() {
  if (!props.canSubmit || props.isSubmitting) return;
  emit("finish");
}

function onBack() {
  emit("back");
}

function onEdit(section) {
  emit("edit", section);
}

const submitButtonLabel = computed(() =>
  props.requiresManualApproval
    ? t("checkout.review.sendBookingRequest")
    : t("checkout.review.commitBooking"),
);
</script>

<template>
  <div class="checkout-review">
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
      <div class="lg:col-span-7 xl:col-span-8 space-y-0">
        <section
          class="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8"
        >
          <div class="flex items-start justify-between gap-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ selectionSectionTitle || $t("checkout.review.sectionPeriod") }}
            </h3>
            <UButton
              v-if="showSelectionEdit"
              variant="link"
              color="primary"
              size="sm"
              class="shrink-0 p-0"
              @click="onEdit('period')"
            >
              {{ $t("checkout.review.edit") }}
            </UButton>
          </div>

          <dl class="space-y-6">
            <div
              v-if="showPeriodSummary"
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt class="text-sm text-gray-500 dark:text-gray-400 mb-0.5">
                {{ $t("checkout.review.dateLabel") }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                <template
                  v-if="groupBookingAttempts && groupBookingAttempts.length > 0"
                >
                  <div class="font-semibold">
                    {{
                      $t("groupBooking.review.heading", {
                        count: groupBookingAttempts.length,
                      })
                    }}
                  </div>
                  <ul class="mt-2 space-y-1 max-h-60 overflow-y-auto pr-1">
                    <li
                      v-for="attempt in groupBookingAttempts"
                      :key="attempt.start"
                      class="text-gray-700 dark:text-gray-300"
                    >
                      <span class="font-medium">
                        {{ formatDateLong(attempt.start) }}
                      </span>
                      <span class="text-gray-500 dark:text-gray-400">
                        · {{ formatTime(attempt.start) }} –
                        {{ formatTime(attempt.end) }}
                      </span>
                    </li>
                  </ul>
                </template>
                <template
                  v-else-if="
                    selectedTimePeriod?.start && selectedTimePeriod?.end
                  "
                >
                  <div class="font-semibold">
                    {{
                      formatDateLong(selectedTimePeriod.start) +
                      (new Date(selectedTimePeriod.start).toDateString() !==
                      new Date(selectedTimePeriod.end).toDateString()
                        ? ` – ${formatDateLong(selectedTimePeriod.end)}`
                        : "")
                    }}
                  </div>
                  <div
                    v-if="formattedTimeRange"
                    class="text-gray-600 dark:text-gray-300 mt-0.5"
                  >
                    {{ formattedTimeRange }}
                  </div>
                </template>
                <template v-else>
                  <span class="text-gray-500 dark:text-gray-400">{{
                    $t("checkout.review.periodMissing")
                  }}</span>
                </template>
              </dd>
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t("checkout.review.bookingLabel") }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                <template v-if="leadSummaryRow">
                  <div class="font-semibold">{{ leadSummaryRow.label }}</div>
                  <div
                    v-if="bookingLineSubtitle(leadSummaryRow)"
                    class="text-gray-600 dark:text-gray-300 mt-0.5"
                  >
                    {{ bookingLineSubtitle(leadSummaryRow) }}
                  </div>
                </template>
                <span v-else class="text-gray-500 dark:text-gray-400">–</span>
              </dd>
            </div>

            <div
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t("checkout.review.addonsLabel") }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                <template v-if="addonSummaryRows.length">
                  <div
                    v-for="row in addonSummaryRows"
                    :key="row.id"
                    class="mb-4 last:mb-0"
                  >
                    <div class="font-semibold">{{ row.label }}</div>
                    <div
                      v-if="bookingLineSubtitle(row)"
                      class="text-gray-600 dark:text-gray-300 mt-0.5"
                    >
                      {{ bookingLineSubtitle(row) }}
                    </div>
                  </div>
                </template>
                <span v-else class="text-gray-500 dark:text-gray-400">–</span>
              </dd>
            </div>
          </dl>
        </section>

        <section
          class="border-b border-gray-200 dark:border-gray-700 pb-8 mb-8"
        >
          <div class="flex items-start justify-between gap-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("checkout.review.sectionContact") }}
            </h3>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="shrink-0 p-0"
              @click="onEdit('data')"
            >
              {{ $t("checkout.review.edit") }}
            </UButton>
          </div>

          <dl class="space-y-6">
            <div
              v-for="row in contactReviewRows"
              :key="row.key"
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt class="text-sm text-gray-500 dark:text-gray-400 mb-0.5 break-words">
                {{ row.label }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white break-words min-w-0 whitespace-pre-line">
                <div class="font-semibold">
                  {{ row.value }}
                </div>
              </dd>
            </div>

            <div v-if="showComment && customerComment?.trim()">
              <dt
                class="text-sm text-gray-500 dark:text-gray-400 break-words mb-0.5"
              >
                {{ $t("checkout.data.commentLabel") }}
              </dt>
              <dd
                class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words min-w-0"
              >
                {{ customerComment }}
              </dd>
            </div>

            <div
              v-for="(row, idx) in customFieldRows"
              :key="'cf-' + idx"
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt
                class="text-sm text-gray-500 dark:text-gray-400 break-words mb-0.5"
              >
                {{ row.label }}
              </dt>
              <dd
                class="text-sm text-gray-900 dark:text-white whitespace-pre-wrap break-words min-w-0"
              >
                {{ row.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section v-if="showPaymentSummary && paymentLabel" class="pb-2">
          <div class="flex items-start justify-between gap-4 mb-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              {{ $t("checkout.review.sectionPayment") }}
            </h3>
            <UButton
              variant="link"
              color="primary"
              size="sm"
              class="shrink-0 p-0"
              @click="onEdit('payment')"
            >
              {{ $t("checkout.review.edit") }}
            </UButton>
          </div>

          <dl class="space-y-6">
            <div
              class="grid grid-cols-1 sm:grid-cols-[minmax(9rem,auto)_1fr] gap-x-8 gap-y-1"
            >
              <dt class="text-sm text-gray-500 dark:text-gray-400">
                {{ $t("checkout.review.paymentMethodLabel") }}
              </dt>
              <dd class="text-sm text-gray-900 dark:text-white">
                <div class="font-semibold">{{ paymentLabel }}</div>
                <div
                  v-if="paymentHint"
                  class="text-gray-500 dark:text-gray-400 mt-0.5 text-sm font-normal"
                >
                  {{ paymentHint }}
                </div>
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <aside class="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6 space-y-6">
        <UCard
          v-if="hasFreeBookingOption"
          variant="soft"
          class="rounded-lg border border-emerald-200 dark:border-emerald-900"
        >
          <div class="space-y-3">
            <p class="text-sm font-medium text-gray-900 dark:text-white">
              {{ $t("checkout.review.freeBookingTitle") }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-300">
              {{
                bookWithPrice
                  ? $t("checkout.review.freeBookingPaidDescription")
                  : $t("checkout.review.freeBookingAppliedDescription")
              }}
            </p>
            <USwitch
              v-model="bookWithPrice"
              :label="$t('checkout.review.bookWithPriceToggle')"
            />
          </div>
        </UCard>

        <UCard v-if="enableCoupons" variant="soft" class="rounded-lg">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
            {{ $t("checkout.review.discountCodeTitle") }}
          </p>

          <div v-if="appliedCoupon" class="space-y-3">
            <div
              class="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-200 dark:border-gray-700"
            >
              <span
                class="font-mono text-sm text-gray-900 dark:text-white truncate"
                >{{ appliedCoupon }}</span
              >
              <UButton
                color="neutral"
                variant="ghost"
                size="sm"
                icon="i-lucide-x"
                @click="removeCoupon"
              >
                {{ $t("checkout.review.couponRemove") }}
              </UButton>
            </div>

            <p
              v-if="appliedCouponDetails?.description || redeemDiscountLabel"
              class="text-xs text-gray-600 dark:text-gray-400 space-y-1"
            >
              <span
                v-if="appliedCouponDetails?.description"
                class="block text-gray-800 dark:text-gray-200"
                >{{ appliedCouponDetails.description }}</span
              >
              <span v-if="redeemDiscountLabel" class="block">{{
                redeemDiscountLabel
              }}</span>
            </p>
          </div>

          <div v-else class="space-y-2">
            <div
              class="flex flex-wrap items-end gap-3 border-b border-gray-200 dark:border-gray-700 pb-2"
            >
              <UInput
                v-model="couponDraft"
                class="flex-1 min-w-[8rem]"
                :placeholder="$t('checkout.review.couponPlaceholder')"
                autocomplete="off"
                :disabled="couponApplying"
                @keyup.enter="applyCoupon"
              />
              <UButton
                variant="link"
                color="primary"
                size="sm"
                :loading="couponApplying"
                class="shrink-0 uppercase tracking-wide font-semibold"
                @click="applyCoupon"
              >
                {{ $t("checkout.review.couponApply") }}
              </UButton>
            </div>
            <p
              v-if="couponError"
              class="text-sm text-red-600 dark:text-red-400 mt-1"
            >
              {{ couponError }}
            </p>
          </div>
        </UCard>

        <UCard variant="soft" class="rounded-lg">
          <p class="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
            {{ $t("checkout.review.overviewCardTitle") }}
          </p>

          <div
            v-if="isValidating"
            class="flex items-center gap-2 text-gray-500 py-4"
          >
            <UIcon name="i-lucide-loader-2" class="animate-spin" size="18" />
            <span>{{ $t("checkout.review.priceUpdating") }}</span>
          </div>

          <ul v-else-if="summary?.items?.length" class="space-y-3 text-sm">
            <li
              v-for="row in summary.items"
              :key="row.id"
              class="flex justify-between gap-3"
            >
              <span
                class="text-gray-600 dark:text-gray-400"
                :class="
                  row.skipQuantity
                    ? 'text-emerald-800 dark:text-emerald-200'
                    : ''
                "
              >
                {{ row.label }}
              </span>
              <div
                class="tabular-nums font-medium shrink-0 text-right min-w-[80px]"
              >
                <span
                  v-if="hasOriginalPriceForSummaryRow(row)"
                  class="block text-xs text-gray-400 line-through"
                >
                  {{ formatEur(displayOriginalPriceForSummaryRow(row)) }}
                </span>
                <span
                  :class="
                    row.skipQuantity
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-gray-900 dark:text-white'
                  "
                >
                  <template v-if="displayPriceForSummaryRow(row) != null">{{
                    formatEur(displayPriceForSummaryRow(row))
                  }}</template>
                  <template v-else>–</template>
                </span>
              </div>
            </li>
            <li
              v-if="summary.taxAmount > 0"
              class="flex justify-between gap-3 pt-2 text-gray-600 dark:text-gray-400"
            >
              <span>{{ $t("checkout.review.taxLabel") }}</span>
              <span class="tabular-nums">{{
                formatEur(summary.taxAmount)
              }}</span>
            </li>
            <li
              class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-2 flex justify-between items-baseline gap-3"
            >
              <span class="text-sm text-gray-500 dark:text-gray-400">{{
                $t("checkout.review.totalLabel")
              }}</span>
              <span
                class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white tabular-nums text-right"
              >
                <template
                  v-if="summary.total <= 0.005 && summary.items?.length"
                >
                  {{ $t("checkout.review.totalFree") }}
                </template>
                <template v-else>{{ formatEur(summary.total) }}</template>
              </span>
            </li>
          </ul>

          <p v-else class="text-gray-500 dark:text-gray-400 text-sm py-2">
            {{ $t("checkout.review.priceUnavailable") }}
          </p>

          <div class="mt-6 space-y-3">
            <p
              v-if="requiresManualApproval"
              class="text-sm text-gray-600 dark:text-gray-300"
            >
              {{ $t("checkout.manualApproval.submitHint") }}
            </p>
            <UButton
              color="primary"
              :variant="canSubmit? 'solid' : 'soft'"
              block
              size="lg"
              :trailing-icon="canSubmit ? 'i-lucide-check' : 'i_lucide-x'"
              :disabled="!canSubmit"
              :class="!canSubmit ? 'text-gray-500' : ''"
              :loading="isSubmitting"
              @click="onFinish"
            >
              {{ submitButtonLabel }}
            </UButton>
            <div class="text-center">
              <UButton
                variant="link"
                color="neutral"
                size="sm"
                icon="i-lucide-arrow-left"
                class="text-gray-500"
                @click="onBack"
              >
                {{
                  hasPaymentStep
                    ? $t("checkout.review.backToPayment")
                    : $t("checkout.review.backToData")
                }}
              </UButton>
            </div>
          </div>
        </UCard>
      </aside>
    </div>
  </div>
</template>
