import {
  CalendarDate,
  fromDate,
  getLocalTimeZone,
  toCalendarDate,
} from "@internationalized/date";

function pad2(n) {
  return String(n).padStart(2, "0");
}

/**
 * Format a JS Date as YYYY-MM-DD in the local calendar (no time component).
 */
export function formatLocalDateIso(date) {
  if (!date) return "";
  const cal = toCalendarDate(fromDate(date, getLocalTimeZone()));
  return `${String(cal.year).padStart(4, "0")}-${pad2(cal.month)}-${pad2(cal.day)}`;
}

/**
 * Whether a typed YYYY-MM-DD lies before the local day of `minDate`, e.g.
 * today for a booking (ECCdigital/tickets#188). No date or no minimum is not
 * before.
 */
export function isIsoDateBefore(iso, minDate) {
  if (!iso || !minDate) return false;
  return String(iso) < formatLocalDateIso(minDate);
}

/**
 * Whether the local day of `date` lies before the local day of `minDate`,
 * e.g. a start before today (ECCdigital/tickets#188). No date or no minimum
 * is not before.
 */
export function isDayBefore(date, minDate) {
  if (!date) return false;
  return isIsoDateBefore(formatLocalDateIso(date), minDate);
}

/**
 * Parse YYYY-MM-DD into a local midnight JS Date.
 *
 * Uses CalendarDate instead of `new Date(y, m - 1, d)` so years below 100 are
 * not expanded to 1900–1999 while the user is typing a 4-digit year (e.g. 6 → 1906).
 */
export function parseLocalDateIso(iso) {
  if (!iso) return null;
  const match = /^(\d{1,4})-(\d{1,2})-(\d{1,2})$/.exec(String(iso));
  if (!match) return null;

  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  try {
    const cal = new CalendarDate(year, month, day);
    if (cal.year !== year || cal.month !== month || cal.day !== day) return null;

    const result = cal.toDate(getLocalTimeZone());
    result.setHours(0, 0, 0, 0);
    return result;
  } catch {
    return null;
  }
}

/**
 * Apply a local time to a JS date without using `new Date(y, m, d, …)`.
 * The Date constructor treats years 0–99 as 1900–1999 and breaks partial year entry.
 */
export function jsDateWithTime(date, hours = 0, minutes = 0, seconds = 0, ms = 0) {
  if (!date) return null;
  const cal = toCalendarDate(fromDate(date, getLocalTimeZone()));
  const result = cal.toDate(getLocalTimeZone());
  result.setHours(hours, minutes, seconds, ms);
  return result;
}
