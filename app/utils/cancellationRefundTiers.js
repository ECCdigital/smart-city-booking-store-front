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
 * The refund share of a preview as the backend's mails read it: the applied
 * percentage, else the suggested one, else 0. One value for every hint.
 *
 * @param {{ appliedRefundPercentage?: number|null, suggestedRefundPercentage?: number|null }} [preview]
 * @returns {number}
 */
export function refundPercentOf(preview) {
  const applied = preview?.appliedRefundPercentage;
  if (Number.isFinite(applied)) return applied;
  const suggested = preview?.suggestedRefundPercentage;
  return Number.isFinite(suggested) ? suggested : 0;
}

/**
 * The time before the start in the UI language, such as „1 Tag und 22
 * Stunden“. The backend applies the rule (`timeBeforeStart` of the preview:
 * days, and hours only where they are named, else 0); this only words it.
 * `null` where the preview names no time.
 *
 * @param {{ days?: number, hours?: number }|null} [time]
 * @param {Function} t vue-i18n's `t`
 * @returns {string|null}
 */
export function wordTimeBeforeStart(time, t) {
  if (!Number.isFinite(time?.days) || !Number.isFinite(time?.hours)) {
    return null;
  }
  const days = t("booking.cancellation.timeDays", { n: time.days }, time.days);
  const hours = t(
    "booking.cancellation.timeHours",
    { n: time.hours },
    time.hours,
  );
  if (time.days === 0) return hours;
  if (time.hours === 0) return days;
  return t("booking.cancellation.timeDaysAndHours", { days, hours });
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
