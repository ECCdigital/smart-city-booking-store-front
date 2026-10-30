import {
  BOOKING_STATUS,
  isFreeBooking,
  isSettledBooking,
  resolveBookingStatus,
} from "~/utils/bookingStatus.js";

/**
 * The payment display reads the same slice of a booking as the status
 * facade: `status` first, the flags only where a payload carries no status.
 * @typedef {import("~/utils/bookingStatus.js").StatusBooking} PaymentStatusBooking
 */

export const PAYMENT_DISPLAY_STATUS = {
  FREE: "free",
  PAID: "paid",
  UNPAID: "unpaid",
  WAIVED: "waived",
};

/**
 * Cancelled before it was paid, and the cancellation left no fee: nothing
 * was paid and nothing is owed. A cancellation without a refund record stays
 * unpaid - it cannot tell.
 * @param {PaymentStatusBooking} booking
 * @returns {boolean}
 */
function isWaivedBooking(booking) {
  if (resolveBookingStatus(booking) !== BOOKING_STATUS.CANCELLED) {
    return false;
  }
  const fee = booking?.cancellationRefund?.cancellationFeeEur;
  return fee !== null && fee !== undefined && Number(fee) === 0;
}

/**
 * Whether the booking is free, paid, waived, or still owes something - read
 * off `booking.status` through `isSettledBooking`; the price is checked first
 * so a free booking reads as free in every state.
 * @param {PaymentStatusBooking} booking
 * @returns {typeof PAYMENT_DISPLAY_STATUS[keyof typeof PAYMENT_DISPLAY_STATUS]}
 */
export function resolvePaymentDisplayStatus(booking) {
  if (isFreeBooking(booking)) {
    return PAYMENT_DISPLAY_STATUS.FREE;
  }
  if (isSettledBooking(booking)) {
    return PAYMENT_DISPLAY_STATUS.PAID;
  }
  if (isWaivedBooking(booking)) {
    return PAYMENT_DISPLAY_STATUS.WAIVED;
  }
  return PAYMENT_DISPLAY_STATUS.UNPAID;
}

/**
 * @param {PaymentStatusBooking} booking
 * @returns {boolean}
 */
export function isPaidBooking(booking) {
  return resolvePaymentDisplayStatus(booking) === PAYMENT_DISPLAY_STATUS.PAID;
}

/**
 * @param {PaymentStatusBooking} booking
 * @returns {boolean}
 */
export function isUnpaidBooking(booking) {
  return resolvePaymentDisplayStatus(booking) === PAYMENT_DISPLAY_STATUS.UNPAID;
}

const PAYMENT_PRESENTATION = {
  [PAYMENT_DISPLAY_STATUS.FREE]: {
    labelKey: "booking.payment.free",
    classes:
      "w-[100px] bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
    icon: "i-lucide-gift",
  },
  [PAYMENT_DISPLAY_STATUS.PAID]: {
    labelKey: "booking.payment.paid",
    classes:
      "w-[90px] bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    icon: "i-lucide-check",
  },
  [PAYMENT_DISPLAY_STATUS.UNPAID]: {
    labelKey: "booking.payment.unpaid",
    classes:
      "w-[120px] bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    icon: "i-lucide-hourglass",
  },
  [PAYMENT_DISPLAY_STATUS.WAIVED]: {
    labelKey: "booking.payment.waived",
    classes:
      "w-[85px] bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: "i-lucide-circle-slash",
  },
};

const CHECKOUT_PAYMENT_STATE_CLASS = {
  [PAYMENT_DISPLAY_STATUS.FREE]:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  [PAYMENT_DISPLAY_STATUS.PAID]:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  [PAYMENT_DISPLAY_STATUS.UNPAID]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
  [PAYMENT_DISPLAY_STATUS.WAIVED]:
    "bg-gray-100 text-gray-700 dark:bg-gray-800/40 dark:text-gray-300",
};

const CHECKOUT_PAYMENT_LABEL_KEY = {
  [PAYMENT_DISPLAY_STATUS.FREE]: "checkout.status.paymentFree",
  [PAYMENT_DISPLAY_STATUS.PAID]: "checkout.status.paymentPaid",
  [PAYMENT_DISPLAY_STATUS.UNPAID]: "checkout.status.paymentPending",
  [PAYMENT_DISPLAY_STATUS.WAIVED]: "checkout.status.paymentWaived",
};

/**
 * @param {PaymentStatusBooking} booking
 * @param {(key: string) => string} t
 * @returns {{ status: string, label: string, classes: string, icon: string }}
 */
export function resolveBookingPaymentChip(booking, t) {
  const status = resolvePaymentDisplayStatus(booking);
  const presentation = PAYMENT_PRESENTATION[status];

  return {
    status,
    label: t(presentation.labelKey),
    classes: presentation.classes,
    icon: presentation.icon,
  };
}

/**
 * @param {PaymentStatusBooking} booking
 * @param {(key: string) => string} t
 * @returns {{ status: string, label: string, labelKey: string, className: string }}
 */
export function resolveCheckoutPaymentState(booking, t) {
  const status = resolvePaymentDisplayStatus(booking);
  const labelKey = CHECKOUT_PAYMENT_LABEL_KEY[status];

  return {
    status,
    labelKey,
    label: t(labelKey),
    className: CHECKOUT_PAYMENT_STATE_CLASS[status],
  };
}

/**
 * @param {PaymentStatusBooking} booking
 * @param {(key: string) => string} t
 * @returns {string}
 */
export function resolveBookingPaymentSearchLabel(booking, t) {
  const status = resolvePaymentDisplayStatus(booking);
  const labelKey = PAYMENT_PRESENTATION[status].labelKey;
  return t(labelKey).toLowerCase();
}
