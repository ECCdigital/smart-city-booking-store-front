<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="subtitle"
    :dismissible="!submitting"
    :ui="{ title: ' font-bold', footer: 'justify-end' }"
  >
    <template #body>
      <!-- Two bars under the header: which of the two steps this is. -->
      <div
        v-if="outcome !== OUTCOME.POLICY"
        class="flex gap-1.5 w-full mb-5"
        aria-hidden="true"
      >
        <span
          class="h-1 flex-1 rounded-full"
          :class="
            stepsDone >= 1 ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'
          "
        />
        <span
          class="h-1 flex-1 rounded-full"
          :class="
            stepsDone >= 2 ? 'bg-secondary' : 'bg-gray-200 dark:bg-gray-700'
          "
        />
      </div>

      <!-- Outcomes: the booking is cancelled, or the backend refused it for good. -->
      <div
        v-if="outcome === OUTCOME.CANCELLED"
        class="flex flex-col items-center text-center gap-2 py-3"
      >
        <span
          class="w-12 h-12 rounded-full flex items-center justify-center bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200"
        >
          <UIcon name="i-lucide-check" class="w-6 h-6" />
        </span>
        <p class="text-sm text-gray-600 dark:text-gray-300 max-w-sm mt-1">
          <i18n-t
            :keypath="doneTextKey"
            scope="global"
          >
            <template #fee>
              <b>{{ formatPrice(preview.data?.cancellationFeeEur) }}</b>
            </template>
            <template #mail>
              <b>{{ mail }}</b>
            </template>
          </i18n-t>
        </p>
      </div>

      <div
        v-else-if="outcome === OUTCOME.POLICY"
        class="flex flex-col items-center text-center gap-2 py-3"
      >
        <span
          class="w-12 h-12 rounded-full flex items-center justify-center bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-200"
        >
          <UIcon name="i-lucide-ban" class="w-6 h-6" />
        </span>
        <h3 class="font-semibold mt-1">
          {{ $t("booking.cancellation.blockedTitle") }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
          {{ $t("booking.cancellation.blockedText", { tenant: tenantName }) }}
        </p>
        <p
          class="text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md px-3 py-2 mt-1 max-w-sm"
        >
          {{ contactHint || $t("booking.cancellation.blockedDefault") }}
        </p>
      </div>

      <div
        v-else-if="outcome === OUTCOME.GONE"
        class="flex flex-col items-center text-center gap-2 py-3"
      >
        <span
          class="w-12 h-12 rounded-full flex items-center justify-center bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
        >
          <UIcon name="i-lucide-circle-x" class="w-6 h-6" />
        </span>
        <h3 class="font-semibold mt-1">
          {{ $t("booking.cancellation.goneTitle") }}
        </h3>
        <p class="text-sm text-gray-600 dark:text-gray-300 max-w-sm">
          {{ $t("booking.cancellation.goneText") }}
        </p>
      </div>

      <!-- Step 1: the booking and what the backend would refund now. -->
      <div v-else-if="step === 1" class="flex flex-col gap-5">
        <div class="flex justify-between items-start gap-3">
          <div>
            <p class="text-lg font-bold tabular-nums text-primary">
              #{{ booking.id }}
            </p>
            <p class="font-medium mt-0.5">{{ bookingTitle }}</p>
            <p v-if="period" class="text-sm text-gray-500 dark:text-gray-400">
              {{ period }}
            </p>
          </div>
          <BookingPayedChip
            v-if="!isFree"
            :booking="booking"
            class="shrink-0"
          />
        </div>

        <p v-if="isFree" class="text-sm text-gray-600 dark:text-gray-300">
          {{ $t("booking.cancellation.freeBooking") }}
        </p>

        <div v-else-if="preview.loading" aria-busy="true">
          <dl class="text-sm">
            <div
              class="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-800"
            >
              <dt>{{ $t("booking.cancellation.originalAmount") }}</dt>
              <dd><USkeleton class="h-4 w-14" /></dd>
            </div>
            <div
              class="flex justify-between py-2.5 border-b border-gray-100 dark:border-gray-800"
            >
              <dt>{{ $t("booking.cancellation.fee") }}</dt>
              <dd><USkeleton class="h-4 w-16" /></dd>
            </div>
            <div
              class="flex justify-between pt-3 mt-0.5 border-t border-gray-300 dark:border-gray-600 font-semibold"
            >
              <dt>{{ receiptTotalLabel }}</dt>
              <dd><USkeleton class="h-5 w-20" /></dd>
            </div>
          </dl>
          <USkeleton class="h-3.5 w-full mt-4" />
        </div>

        <!-- Unpaid and no fee by the tiers: nothing to refund, nothing to pay. -->
        <p
          v-else-if="preview.data && !isPaid && !feeDue"
          class="flex gap-2.5 text-sm text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-800 rounded-md px-3.5 py-2.5"
        >
          <UIcon
            name="i-lucide-info"
            class="w-4.5 h-4.5 shrink-0 mt-0.5 text-gray-500"
          />
          <span>
            {{
              $t("booking.cancellation.unpaidBooking", {
                amount: formatPrice(booking.priceEur),
              })
            }}
          </span>
        </p>

        <!-- Paid: the refund. Unpaid with a fee by the tiers: the fee still to pay. -->
        <div v-else-if="preview.data">
          <p
            v-if="feeDue"
            class="flex gap-2.5 text-sm text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950 rounded-md px-3.5 py-2.5 mb-4"
          >
            <UIcon
              name="i-lucide-triangle-alert"
              class="w-4.5 h-4.5 shrink-0 mt-0.5"
            />
            <span>
              {{
                $t("booking.cancellation.unpaidFeeDue", {
                  fee: formatPrice(preview.data.cancellationFeeEur),
                })
              }}
            </span>
          </p>
          <dl class="text-sm">
            <div
              class="flex justify-between gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800"
            >
              <dt class="text-gray-700 dark:text-gray-300">
                {{ $t("booking.cancellation.originalAmount") }}
              </dt>
              <dd class="tabular-nums">
                {{ formatPrice(preview.data.originalAmountEur) }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800"
            >
              <dt class="text-gray-700 dark:text-gray-300">
                {{ $t("booking.cancellation.fee") }}
                <span v-if="feePercent !== null" class="text-gray-400 ml-1.5">
                  {{
                    $t("booking.cancellation.feePercent", {
                      percent: feePercent,
                    })
                  }}
                </span>
              </dt>
              <dd class="tabular-nums">
                {{ isPaid ? "−" : "" }}
                {{ formatPrice(preview.data.cancellationFeeEur) }}
              </dd>
            </div>
            <div
              class="flex justify-between gap-3 pt-3 mt-0.5 border-t border-gray-300 dark:border-gray-600 text-base font-semibold"
            >
              <dt>{{ receiptTotalLabel }}</dt>
              <dd class="tabular-nums">
                {{ formatPrice(receiptTotal) }}
              </dd>
            </div>
          </dl>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {{ tierHint }}
          </p>
        </div>

        <UAlert
          v-else
          color="warning"
          variant="soft"
          icon="i-lucide-triangle-alert"
          :title="
            $t(
              isPaid
                ? 'booking.cancellation.previewFailedTitle'
                : 'booking.cancellation.previewFailedTitleUnpaid',
            )
          "
          :description="
            $t(
              isPaid
                ? 'booking.cancellation.previewFailedText'
                : 'booking.cancellation.previewFailedTextUnpaid',
              { amount: formatPrice(booking.priceEur), tenant: tenantName },
            )
          "
          :actions="[
            {
              label: $t('booking.cancellation.recalculate'),
              icon: 'i-lucide-refresh-cw',
              color: 'warning',
              variant: 'link',
              onClick: loadPreview,
            },
          ]"
        />
      </div>

      <!-- Step 2: the reason, bank details for a paid booking, the consequence. -->
      <div v-else class="flex flex-col gap-5">
        <div
          v-if="preview.data && (isPaid || feeDue)"
          class="flex justify-between items-center text-sm rounded-md px-3.5 py-2.5"
          :class="
            feeDue
              ? 'bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
              : 'bg-gray-100 dark:bg-gray-800'
          "
        >
          <span>
            {{
              $t(
                isPaid
                  ? "booking.cancellation.expectedRefund"
                  : "booking.cancellation.dueNow",
              )
            }}
          </span>
          <b class="tabular-nums">{{ formatPrice(receiptTotal) }}</b>
        </div>

        <UAlert
          v-if="submitFailed"
          color="error"
          variant="soft"
          icon="i-lucide-circle-x"
          :title="$t('booking.cancellation.failedTitle')"
          :description="$t('booking.cancellation.failedText')"
        />

        <UFormField
          :label="$t('booking.cancellation.reason')"
          :error="reasonError"
          required
        >
          <UTextarea
            v-model="form.reason"
            :rows="3"
            autoresize
            :placeholder="$t('booking.cancellation.reasonPlaceholder')"
            :disabled="submitting"
            class="w-full"
            @update:model-value="reasonTouched = true"
          />
        </UFormField>

        <div v-if="requiresBankDetails" class="flex flex-col gap-3">
          <div>
            <p class="text-sm font-semibold">
              {{ $t("booking.cancellation.bankTitle") }}
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ $t("booking.cancellation.bankHint") }}
            </p>
          </div>

          <!--
            The fields sit inside the option that asks for them, so choosing
            it folds them out in place. The card is a label; clicks and keys
            in the fields stay with the fields (interactive descendants).
          -->
          <URadioGroup
            v-model="form.bankMode"
            :items="bankModeItems"
            variant="card"
            color="secondary"
            :disabled="submitting"
            :ui="{ description: 'w-full' }"
          >
            <template #description="{ item }">
              {{ item.description }}
              <div
                v-if="
                  item.value === BANK_MODE.FORM &&
                  form.bankMode === BANK_MODE.FORM
                "
                class="flex flex-col gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
              >
                <UFormField :label="$t('booking.cancellation.accountHolder')">
                  <UInput
                    v-model="form.accountHolder"
                    autocomplete="name"
                    :disabled="submitting"
                    class="w-full"
                  />
                </UFormField>
                <UFormField
                  :label="$t('booking.cancellation.iban')"
                  :error="ibanError"
                >
                  <UInput
                    v-model="iban"
                    placeholder="DE89 3704 0044 0532 0130 00"
                    autocomplete="off"
                    spellcheck="false"
                    :disabled="submitting"
                    class="w-full"
                  />
                </UFormField>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <UFormField
                    :label="
                      $t('booking.cancellation.bic') +
                      ' (' +
                      $t('common.optional') +
                      ')'
                    "
                    :error="bicError"
                  >
                    <UInput
                      v-model="bic"
                      placeholder="COBADEFFXXX"
                      autocomplete="off"
                      spellcheck="false"
                      :disabled="submitting"
                      class="w-full"
                    />
                  </UFormField>
                  <UFormField
                    :label="
                      $t('booking.cancellation.bankName') +
                      ' (' +
                      $t('common.optional') +
                      ')'
                    "
                  >
                    <UInput
                      v-model="form.bankName"
                      :disabled="submitting"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </template>
          </URadioGroup>
        </div>

        <p class="flex gap-2.5 text-sm text-gray-600 dark:text-gray-300">
          <UIcon
            name="i-lucide-triangle-alert"
            class="w-4.5 h-4.5 shrink-0 mt-0.5 text-gray-500"
          />
          <span>
            <i18n-t keypath="booking.cancellation.immediateNote" scope="global">
              <template #mail>
                <b>{{ mail }}</b>
              </template>
            </i18n-t>
          </span>
        </p>
      </div>
    </template>

    <template #footer>
      <template v-if="outcome">
        <UButton color="primary" @click="close">
          {{ $t("booking.cancellation.close") }}
        </UButton>
      </template>

      <template v-else-if="step === 1">
        <UButton color="neutral" variant="outline" @click="close">
          {{ $t("common.cancel") }}
        </UButton>
        <UButton color="primary" :disabled="preview.loading" @click="step = 2">
          {{
            preview.data || isFree
              ? $t("booking.cancellation.next")
              : $t("booking.cancellation.nextAnyway")
          }}
        </UButton>
      </template>

      <template v-else>
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-arrow-left"
          class="mr-auto"
          :disabled="submitting"
          @click="step = 1"
        >
          {{ $t("booking.cancellation.back") }}
        </UButton>
        <UButton
          color="error"
          :loading="submitting"
          :disabled="submitting || !!ibanError || !!bicError"
          @click="send"
        >
          {{ $t("booking.cancellation.confirm") }}
        </UButton>
      </template>
    </template>
  </UModal>
</template>

<script setup>
import BookingPayedChip from "~/components/user/bookings/BookingPayedChip.vue";
import { useBookings } from "~/composables/api/useBookings.js";
import { useFormatting } from "~/composables/utils/useFormatting.js";
import { useAuthStore } from "~~/stores/auth";
import { useBookingStore } from "~~/stores/bookings.js";
import {
  CANCELLATION_FAILURE,
  cancellationContactHintOf,
  resolveCancellationFailure,
} from "~/utils/bookingCancellation.js";
import { isFreeBooking, isSettledBooking } from "~/utils/bookingStatus.js";
import {
  formatIban,
  isValidBic,
  isValidIban,
  normalizeBic,
  normalizeIban,
} from "~/utils/iban.js";

/**
 * The direct cancellation in two steps: first the refund the backend would
 * grant now, then the reason (mandatory) and, for a paid booking, how the
 * refund reaches the customer.
 */

const OUTCOME = Object.freeze({
  CANCELLED: "cancelled",
  POLICY: CANCELLATION_FAILURE.POLICY,
  GONE: CANCELLATION_FAILURE.GONE,
});

const BANK_MODE = Object.freeze({ FORM: "form", EMAIL: "email" });

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const open = defineModel("open", { type: Boolean, default: false });

/** After a cancellation or a 409 the caller's booking is stale: it reloads. */
const emit = defineEmits(["cancelled"]);

const { t } = useI18n();
const { formatDate, formatPrice } = useFormatting();
const { getBookingTenant } = useTenant();
const { getCancellationRefundPreview, cancelBooking } = useBookings();
const authStore = useAuthStore();
const bookingStore = useBookingStore();

const step = ref(1);
const outcome = ref(null);
const submitting = ref(false);
const submitFailed = ref(false);
const reasonTouched = ref(false);
const preview = reactive({ loading: false, data: null });
const form = reactive({
  reason: "",
  bankMode: BANK_MODE.EMAIL,
  accountHolder: "",
  iban: "",
  bic: "",
  bankName: "",
});

const isFree = computed(() => isFreeBooking(props.booking));
/**
 * Money has flowed: only then is there a refund and somewhere for it to go.
 * A priced booking that is not paid yet (requested, payment due) gets no
 * refund; the preview still matters for it, because the fee the tiers name
 * stays due and has to be paid after the cancellation.
 */
const isPaid = computed(() => !isFree.value && isSettledBooking(props.booking));
const requiresBankDetails = isPaid;
/** Unpaid, and the tiers name a fee: it is still to pay. */
const feeDue = computed(
  () =>
    !isFree.value &&
    !isPaid.value &&
    Number(preview.data?.cancellationFeeEur) > 0,
);
/** The receipt's last line: the refund, or the fee still to pay. */
const receiptTotalLabel = computed(() =>
  t(isPaid.value ? "booking.cancellation.refund" : "booking.cancellation.dueNow"),
);
const receiptTotal = computed(() =>
  isPaid.value
    ? preview.data?.refundAmountEur
    : preview.data?.cancellationFeeEur,
);
const doneTextKey = computed(() => {
  if (isFree.value) return "booking.cancellation.doneText";
  if (feeDue.value) return "booking.cancellation.doneTextFeeDue";
  return "booking.cancellation.doneTextPriced";
});

const tenantName = computed(
  () => getBookingTenant(props.booking)?.name || t("account.unknownTenant"),
);
const contactHint = computed(() => cancellationContactHintOf(props.booking));
const mail = computed(
  () => props.booking.mail || authStore.getUser?.email || "",
);

const bookingTitle = computed(() => {
  const items = props.booking.bookableItems;
  if (Array.isArray(items) && items.length > 0) {
    return items
      .map((item) => item._bookableUsed?.title)
      .filter(Boolean)
      .join(", ");
  }
  return props.booking.objectName || t("booking.unknownBookable");
});

const period = computed(() => {
  const begin = props.booking.timeBegin ?? props.booking.eventBegin;
  const end = props.booking.timeEnd ?? props.booking.eventEnd;
  return begin && end ? `${formatDate(begin)} – ${formatDate(end)}` : "";
});

const feePercent = computed(() => {
  const refundPercent = Number(preview.data?.appliedRefundPercentage);
  return Number.isFinite(refundPercent) ? 100 - refundPercent : null;
});

const tierHint = computed(() => {
  const data = preview.data;
  if (!data) return "";
  const days = Math.max(0, Number(data.daysBeforeStart) || 0);
  return t("booking.cancellation.tierHint", {
    when: t("booking.cancellation.daysBeforeStart", { n: days }, days),
    tierDays: data.appliedTierDays ?? days,
    tenant: tenantName.value,
    percent: data.appliedRefundPercentage ?? 0,
    feePercent: feePercent.value ?? 100,
  });
});

const bankModeItems = computed(() => [
  {
    value: BANK_MODE.FORM,
    label: t("booking.cancellation.bankModeForm"),
    description: t("booking.cancellation.bankModeFormDescription"),
  },
  {
    value: BANK_MODE.EMAIL,
    label: t("booking.cancellation.bankModeEmail"),
    description: t("booking.cancellation.bankModeEmailDescription", {
      tenant: tenantName.value,
    }),
  },
]);

/** The IBAN as typed, kept in groups of four; the BIC upper case. */
const iban = computed({
  get: () => form.iban,
  set: (value) => {
    form.iban = formatIban(value);
  },
});
const bic = computed({
  get: () => form.bic,
  set: (value) => {
    form.bic = normalizeBic(value);
  },
});

const reasonMissing = computed(() => form.reason.trim() === "");
/** Shown once the customer has touched the field or tried to send. */
const reasonError = computed(() =>
  reasonTouched.value && reasonMissing.value
    ? t("booking.cancellation.reasonRequired")
    : undefined,
);

const bankDetailsWanted = computed(
  () => requiresBankDetails.value && form.bankMode === BANK_MODE.FORM,
);
const ibanError = computed(() =>
  bankDetailsWanted.value && form.iban && !isValidIban(form.iban)
    ? t("booking.cancellation.ibanInvalid")
    : undefined,
);
const bicError = computed(() =>
  bankDetailsWanted.value && form.bic && !isValidBic(form.bic)
    ? t("booking.cancellation.bicInvalid")
    : undefined,
);

const stepsDone = computed(() => (outcome.value ? 2 : step.value));

const title = computed(() =>
  outcome.value === OUTCOME.CANCELLED
    ? t("booking.cancellation.doneTitle")
    : t("booking.cancellation.title"),
);
const subtitle = computed(() => {
  switch (outcome.value) {
    case OUTCOME.CANCELLED:
      return t("booking.cancellation.doneSubtitle");
    case OUTCOME.POLICY:
      return t("booking.cancellation.blockedSubtitle");
    default:
      return step.value === 1
        ? t("booking.cancellation.stepRefund")
        : t("booking.cancellation.stepDetails");
  }
});

async function loadPreview() {
  if (isFree.value) return;
  preview.loading = true;
  preview.data = null;
  try {
    preview.data = await getCancellationRefundPreview(
      props.booking.tenantId,
      props.booking.id,
    );
  } catch {
    // The alert in step 1 says so; the cancellation stays possible.
  } finally {
    preview.loading = false;
  }
}

function reset() {
  step.value = 1;
  outcome.value = null;
  submitting.value = false;
  submitFailed.value = false;
  reasonTouched.value = false;
  preview.loading = false;
  preview.data = null;
  Object.assign(form, {
    reason: "",
    bankMode: BANK_MODE.EMAIL,
    accountHolder: "",
    iban: "",
    bic: "",
    bankName: "",
  });
}

async function send() {
  reasonTouched.value = true;
  if (
    submitting.value ||
    reasonMissing.value ||
    ibanError.value ||
    bicError.value
  ) {
    return;
  }
  submitting.value = true;
  submitFailed.value = false;
  try {
    await cancelBooking(props.booking.tenantId, props.booking.id, {
      reason: form.reason.trim(),
      bankDetails: bankDetailsWanted.value
        ? {
            accountHolder: form.accountHolder.trim(),
            iban: normalizeIban(form.iban),
            bic: normalizeBic(form.bic),
            bankName: form.bankName.trim(),
          }
        : undefined,
    });
    outcome.value = OUTCOME.CANCELLED;
  } catch (error) {
    const failure = resolveCancellationFailure(error);
    if (failure === CANCELLATION_FAILURE.REASON) {
      // The backend's own check lands on the field, like the local one.
      form.reason = "";
    } else if (failure) {
      outcome.value = failure;
    } else {
      submitFailed.value = true;
    }
  } finally {
    submitting.value = false;
  }
}

function close() {
  open.value = false;
}

/**
 * Closing after a cancellation or a 409 reloads the bookings, whichever way
 * the dialog closes - the button, the X, Escape or a click outside: the
 * list and the details then show the cancelled state the backend holds.
 * The caller's booking turns stale with it, so the dialog is told to close
 * first and reloads only then; a caller that unmounts it on the new state
 * no longer cuts a dialog that is still open.
 */
async function reloadAfterClose() {
  await bookingStore.fetchBookings({ force: true });
  await refreshNuxtData("bookings");
  emit("cancelled");
}

watch(open, (isOpen) => {
  if (isOpen) {
    reset();
    loadPreview();
    return;
  }
  if (outcome.value === OUTCOME.CANCELLED || outcome.value === OUTCOME.GONE) {
    reloadAfterClose();
  }
});
</script>

<style scoped></style>
