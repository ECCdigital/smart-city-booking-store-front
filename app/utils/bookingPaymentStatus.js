import { isFreeBooking, isSettledBooking } from "~/utils/bookingStatus.js";

/**
 * The price question lives with the status facade, so the state and the
 * payment display read a missing price the same way; callers keep importing
 * it from here.
 */
export { isFreeBooking };

/**
 * The slice of a booking the payment display reads: `status` first, the
 * flags only where a payload carries no status.
 * @typedef {{ status?: string, isPayed?: boolean, priceEur?: number | string | null, cancellationRefund?: { cancelledFrom?: string } }} PaymentStatusBooking
 */

export const PAYMENT_DISPLAY_STATUS = {
  FREE: "free",
  PAID: "paid",
  UNPAID: "unpaid",
};

/**
 * Whether the booking is free, paid, or still owes something - read off
 * `booking.status` through `isSettledBooking`; the price is checked first so
 * a free booking reads as free in every state.
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
};

const CHECKOUT_PAYMENT_STATE_CLASS = {
  [PAYMENT_DISPLAY_STATUS.FREE]:
    "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-200",
  [PAYMENT_DISPLAY_STATUS.PAID]:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200",
  [PAYMENT_DISPLAY_STATUS.UNPAID]:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

const CHECKOUT_PAYMENT_LABEL_KEY = {
  [PAYMENT_DISPLAY_STATUS.FREE]: "checkout.status.paymentFree",
  [PAYMENT_DISPLAY_STATUS.PAID]: "checkout.status.paymentPaid",
  [PAYMENT_DISPLAY_STATUS.UNPAID]: "checkout.status.paymentPending",
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
