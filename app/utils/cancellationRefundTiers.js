/**
 * The refund scale of a tenant as the storefront shows it. The backend names
 * each tier's deadline in whole hours before the start, `hoursBeforeStart`;
 * a day is 24 hours.
 */

const HOURS_PER_DAY = 24;

/**
 * The deadline of a tier: in days where it divides by 24, else in hours.
 *
 * @param {number} hoursBeforeStart
 * @returns {{ amount: number, unit: "days"|"hours" }}
 */
export function tierDeadline(hoursBeforeStart) {
  return hoursBeforeStart % HOURS_PER_DAY === 0
    ? { amount: hoursBeforeStart / HOURS_PER_DAY, unit: "days" }
    : { amount: hoursBeforeStart, unit: "hours" };
}

/**
 * The time left until the start as the booker reads it: whole days from one
 * day on, with the hours beside them only below three days and where there
 * are any; below one day whole hours. `null` where the time is not known.
 *
 * @param {number} hoursBeforeStart
 * @returns {{ days: number, hours: number }|null}
 */
export function timeBeforeStart(hoursBeforeStart) {
  if (!Number.isFinite(hoursBeforeStart) || hoursBeforeStart < 0) return null;
  if (hoursBeforeStart < HOURS_PER_DAY) {
    return { days: 0, hours: hoursBeforeStart };
  }
  const days = Math.floor(hoursBeforeStart / HOURS_PER_DAY);
  const hours =
    hoursBeforeStart < 3 * HOURS_PER_DAY ? hoursBeforeStart % HOURS_PER_DAY : 0;
  return { days, hours };
}

/**
 * The tiers of a bookable that name a deadline and a percentage, the longest
 * deadline first.
 *
 * @param {Array<{ hoursBeforeStart?: number, refundPercentage?: number }>} [tiers]
 */
export function sortedRefundTiers(tiers) {
  return (Array.isArray(tiers) ? tiers : [])
    .filter(
      (tier) =>
        Number.isFinite(tier?.hoursBeforeStart) &&
        Number.isFinite(tier?.refundPercentage),
    )
    .sort((left, right) => right.hoursBeforeStart - left.hoursBeforeStart);
}
