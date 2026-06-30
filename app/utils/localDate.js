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
 * Read the currently displayed date segments from a reka-ui DateField root.
 * Needed because Tab navigation updates segment text without updating v-model.
 */
export function readCalendarDateFromDateFieldRoot(rootEl) {
  if (!rootEl || typeof rootEl.querySelectorAll !== "function") return null;

  const parts = {};
  for (const seg of rootEl.querySelectorAll(
    "[data-reka-date-field-segment], [data-segment]",
  )) {
    const part =
      seg.getAttribute("data-reka-date-field-segment") ??
      seg.getAttribute("data-segment");
    if (!part || part === "literal") continue;
    const text = seg.textContent?.trim() ?? "";
    if (!/^\d+$/.test(text)) continue;
    parts[part] = Number.parseInt(text, 10);
  }

  const { year, month, day } = parts;
  if (!year || !month || !day) return null;

  try {
    return new CalendarDate(year, month, day);
  } catch {
    return null;
  }
}

/**
 * Read hour/minute segments from a reka-ui TimeField root (Tab-safe).
 */
export function readTimeFromTimeFieldRoot(rootEl) {
  if (!rootEl || typeof rootEl.querySelectorAll !== "function") return null;

  const parts = {};
  for (const seg of rootEl.querySelectorAll(
    "[data-reka-time-field-segment], [data-segment]",
  )) {
    const part =
      seg.getAttribute("data-reka-time-field-segment") ??
      seg.getAttribute("data-segment");
    if (!part || part === "literal" || part === "dayPeriod") continue;
    const text = seg.textContent?.trim() ?? "";
    if (!/^\d+$/.test(text)) continue;
    parts[part] = Number.parseInt(text, 10);
  }

  if (parts.hour == null || parts.minute == null) return null;
  return { hours: parts.hour, minutes: parts.minute };
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
 * Convert a CalendarDate-like value from UInputDate to a local midnight JS Date.
 */
export function calendarDateToJsDate(val) {
  if (!val) return null;
  const result = val.toDate(getLocalTimeZone());
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Convert a JS Date (or date-like value) to a CalendarDate for UInputDate.
 */
export function jsDateToCalendarDate(value) {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return toCalendarDate(fromDate(d, getLocalTimeZone()));
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
