/**
 * The booking state as the backend (4.3) stores it in `booking.status`: the
 * one value that says where a booking stands in its life.
 * Do not rename without coordinating with the backend.
 */
export const BOOKING_STATUS = Object.freeze({
  REQUESTED: "requested",
  PAYMENT_DUE: "payment_due",
  CONFIRMED: "confirmed",
  REJECTED: "rejected",
  CANCELLED: "cancelled",
});

const BOOKING_STATUSES = Object.values(BOOKING_STATUS);

/**
 * Stable i18n keys for resolved booking status (frontend).
 * Do not rename without coordinating with the backend.
 */
const BOOKING_STATUS_I18N = {
  AWAITING_APPROVAL: "status.awaiting_approval",
  PAYMENT_EXPECTED: "status.payment_expected",
  PAID_COMPLETED: "status.paid_completed",
  REJECTED: "status.rejected",
  /** Committed (and not rejected), no payable amount or no payment step required */
  CONFIRMED_WITHOUT_PAYMENT: "status.confirmed_without_payment",
};

/**
 * API-level error reason codes (i18n-friendly), used when success: false.
 */
export const BOOKING_STATUS_REASONS = {
  MISSING_PARAMETERS: "booking_status.missing_parameters",
  INTERNAL_ERROR: "booking_status.internal_error",
  BOOKING_NOT_FOUND: "booking_status.booking_not_found",
};

function isPriced(priceEur) {
  return (Number(priceEur) || 0) > 0;
}

/**
 * The state the three derived flags stand for - a port of the backend's
 * `statusFromFlags` (booking-state.js), so both sides read a flag-only
 * payload the same way. The impossible combination "paid but never
 * committed" of a priced booking reads as confirmed: the payment is the
 * stronger statement.
 * @param {{ isCommitted?: boolean, isPayed?: boolean, isRejected?: boolean, priceEur?: number | string | null }} booking
 * @returns {string} One of BOOKING_STATUS
 */
function statusFromFlags(booking) {
  const isCommitted = Boolean(booking?.isCommitted);
  const isPayed = Boolean(booking?.isPayed);
  const isRejected = Boolean(booking?.isRejected);
  const priced = isPriced(booking?.priceEur);

  if (isRejected) {
    return isCommitted ? BOOKING_STATUS.CANCELLED : BOOKING_STATUS.REJECTED;
  }
  if (isPayed && !isCommitted && priced) {
    return BOOKING_STATUS.CONFIRMED;
  }
  if (!isCommitted) {
    return BOOKING_STATUS.REQUESTED;
  }
  if (priced && !isPayed) {
    return BOOKING_STATUS.PAYMENT_DUE;
  }
  return BOOKING_STATUS.CONFIRMED;
}

/**
 * The booking state, read off `booking.status`. A payload that carries no
 * status (the v2 booking-status answer) or one this storefront does not know
 * is read off its flags instead.
 * @param {{ status?: string, isCommitted?: boolean, isPayed?: boolean, isRejected?: boolean, priceEur?: number | string | null }} booking
 * @returns {string} One of BOOKING_STATUS
 */
export function resolveBookingStatus(booking) {
  const status = booking?.status;
  return BOOKING_STATUSES.includes(status) ? status : statusFromFlags(booking);
}

/**
 * A living booking: neither rejected nor cancelled.
 * @param {Record<string, unknown>} booking
 * @returns {boolean}
 */
export function isLiveBooking(booking) {
  const status = resolveBookingStatus(booking);
  return (
    status === BOOKING_STATUS.REQUESTED ||
    status === BOOKING_STATUS.PAYMENT_DUE ||
    status === BOOKING_STATUS.CONFIRMED
  );
}

/**
 * A living booking the provider has approved - with or without a payment
 * still outstanding. A cancelled booking keeps `isCommitted: true` in its
 * flags, so this is not the flag.
 * @param {Record<string, unknown>} booking
 * @returns {boolean}
 */
export function isCommittedBooking(booking) {
  const status = resolveBookingStatus(booking);
  return (
    status === BOOKING_STATUS.PAYMENT_DUE || status === BOOKING_STATUS.CONFIRMED
  );
}

/**
 * Nothing left to pay: the booking is free, paid, or was cancelled out of the
 * paid state. Only a cancelled booking needs more than `status` to tell -
 * `cancellationRefund.cancelledFrom`, or the paid flag where a payload has
 * no refund record.
 * @param {{ status?: string, priceEur?: number | string | null, isPayed?: boolean, cancellationRefund?: { cancelledFrom?: string } }} booking
 * @returns {boolean}
 */
export function isSettledBooking(booking) {
  if (!isPriced(booking?.priceEur)) {
    return true;
  }
  switch (resolveBookingStatus(booking)) {
    case BOOKING_STATUS.CONFIRMED:
      return true;
    case BOOKING_STATUS.CANCELLED: {
      const cancelledFrom = booking?.cancellationRefund?.cancelledFrom;
      return cancelledFrom
        ? cancelledFrom === BOOKING_STATUS.CONFIRMED
        : booking?.isPayed === true;
    }
    default:
      return false;
  }
}

/**
 * Maps a booking entity to a frontend i18n status key, read off
 * `booking.status` - the same table as the backend's `resolveBookingStatusKey`
 * (booking-status-keys.js).
 * @param {{ status?: string, isCommitted?: boolean, isPayed?: boolean, isRejected?: boolean, priceEur?: number | string | null }} booking
 * @returns {string}
 */
export function resolveBookingStatusKey(booking) {
  switch (resolveBookingStatus(booking)) {
    case BOOKING_STATUS.REJECTED:
    case BOOKING_STATUS.CANCELLED:
      return BOOKING_STATUS_I18N.REJECTED;
    case BOOKING_STATUS.REQUESTED:
      return BOOKING_STATUS_I18N.AWAITING_APPROVAL;
    case BOOKING_STATUS.PAYMENT_DUE:
      return BOOKING_STATUS_I18N.PAYMENT_EXPECTED;
    default:
      return isPriced(booking?.priceEur)
        ? BOOKING_STATUS_I18N.PAID_COMPLETED
        : BOOKING_STATUS_I18N.CONFIRMED_WITHOUT_PAYMENT;
  }
}

/**
 * @param {Record<string, unknown>} booking
 * @returns {string}
 */
export function effectiveBookingStatusI18nKey(booking) {
  const key = booking?.statusKey;
  if (typeof key === "string" && key.startsWith("status.")) {
    return key;
  }
  return resolveBookingStatusKey(booking);
}

/**
 * How the account shows each state. `payment_due` reads as confirmed: the
 * payment chip next to it says what is still outstanding.
 */
const STATUS_PRESENTATION = {
  [BOOKING_STATUS.REQUESTED]: {
    labelKey: "booking.status.requested",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
    icon: "i-lucide-hourglass",
    tooltipKey: "booking.status.requestedTooltip",
  },
  [BOOKING_STATUS.PAYMENT_DUE]: {
    labelKey: "booking.status.payment_due",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: "i-lucide-check",
    tooltipKey: null,
  },
  [BOOKING_STATUS.CONFIRMED]: {
    labelKey: "booking.status.confirmed",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: "i-lucide-check",
    tooltipKey: null,
  },
  [BOOKING_STATUS.REJECTED]: {
    labelKey: "booking.status.rejected",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: "i-lucide-x",
    tooltipKey: null,
  },
  [BOOKING_STATUS.CANCELLED]: {
    labelKey: "booking.status.cancelled",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    icon: "i-lucide-x",
    tooltipKey: null,
  },
};

/**
 * @param {Record<string, unknown>} booking
 * @param {(key: string) => string} t
 * @returns {{ status: string, label: string, color: string, icon: string, tooltip: string | null }}
 */
export function resolveBookingStatusChip(booking, t) {
  const status = resolveBookingStatus(booking);
  const presentation = STATUS_PRESENTATION[status];

  return {
    status,
    label: t(presentation.labelKey),
    color: presentation.color,
    icon: presentation.icon,
    tooltip: presentation.tooltipKey ? t(presentation.tooltipKey) : null,
  };
}

/**
 * @param {Record<string, unknown>} booking
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function resolveBookingStatusSearchLabel(booking, t) {
  const status = resolveBookingStatus(booking);
  return t(STATUS_PRESENTATION[status].labelKey).toLowerCase();
}
