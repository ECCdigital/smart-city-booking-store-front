/** The two limits a bookable puts on the amount of one checkout position. */
export interface BookableAmountLimits {
  /** Capacity: how many units may be booked at the same time overall. */
  amount?: number | string | null;
  /** How many units one booking may hold at most; null = unlimited. */
  maxAmountPerBooking?: number | null;
}

/** A configured limit as a whole number; null, 0 or negative = none. */
function positiveLimit(value: unknown): number | null {
  if (value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.trunc(n);
}

/**
 * The per-booking limit of a position the booker chooses. Mandatory add-ons
 * have none: their amount follows the position they belong to.
 */
export function resolvePerBookingLimit(
  bookable: BookableAmountLimits | null | undefined,
  { mandatory = false }: { mandatory?: boolean } = {},
): number | null {
  if (!bookable || mandatory) return null;
  return positiveLimit(bookable.maxAmountPerBooking);
}

/**
 * The cap of one position: the stricter of capacity and per-booking limit,
 * null when neither applies.
 */
export function resolveMaxAmount(
  bookable: BookableAmountLimits | null | undefined,
  { mandatory = false }: { mandatory?: boolean } = {},
): number | null {
  if (!bookable) return null;
  const capacity = positiveLimit(bookable.amount);
  const perBooking = resolvePerBookingLimit(bookable, { mandatory });
  if (capacity == null) return perBooking;
  if (perBooking == null) return capacity;
  return Math.min(capacity, perBooking);
}

/**
 * The per-booking limit a position at `amount` has reached, or null when it
 * is below its cap or the cap is the capacity. A per-booking limit equal to
 * the capacity counts as reached: the booking may not hold more either way.
 */
export function reachedPerBookingLimit(
  amount: number,
  cap: number | null,
  perBookingLimit: number | null | undefined,
): number | null {
  if (cap == null || perBookingLimit == null) return null;
  if (cap !== perBookingLimit || amount < cap) return null;
  return perBookingLimit;
}
