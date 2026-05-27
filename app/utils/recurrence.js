/**
 * Helpers to enumerate booking attempts for a recurring/group booking.
 *
 * A single occurrence is described by a start/end pair (epoch ms). The first
 * occurrence is the seed (start/end). Subsequent occurrences are produced by
 * stepping through the calendar according to the configured rule and keeping
 * the same time-of-day and duration as the seed.
 */

const MAX_OCCURRENCES = 365; // hard safety stop to avoid runaway loops

function clampPositiveInt(value, fallback = 1) {
  const n = Number.parseInt(String(value ?? ""), 10);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return n;
}

function asDate(value) {
  if (value == null) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : new Date(value.getTime());
  }
  const n = Number(value);
  if (Number.isFinite(n)) {
    const d = new Date(n);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  const parsed = Date.parse(String(value));
  return Number.isNaN(parsed) ? null : new Date(parsed);
}

function cloneWithDate(reference, dateOnly) {
  return new Date(
    dateOnly.getFullYear(),
    dateOnly.getMonth(),
    dateOnly.getDate(),
    reference.getHours(),
    reference.getMinutes(),
    reference.getSeconds(),
    reference.getMilliseconds()
  );
}

function lastDayOfMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}

function nthWeekdayOfMonth(year, monthIdx, weekday, ordinal) {
  // weekday: 0=Sunday..6=Saturday (JS standard)
  // ordinal: 1..4 for first..fourth, 5 = last
  if (ordinal === 5) {
    const lastDay = lastDayOfMonth(year, monthIdx);
    for (let day = lastDay; day >= 1; day--) {
      const d = new Date(year, monthIdx, day);
      if (d.getDay() === weekday) return d;
    }
    return null;
  }
  const first = new Date(year, monthIdx, 1);
  const offset = (weekday - first.getDay() + 7) % 7;
  const day = 1 + offset + (ordinal - 1) * 7;
  if (day > lastDayOfMonth(year, monthIdx)) return null;
  return new Date(year, monthIdx, day);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Generate booking attempts for a recurrence rule.
 *
 * @param {Object} rule
 * @param {number} rule.seedStart - epoch ms of the first occurrence's start
 * @param {number} rule.seedEnd - epoch ms of the first occurrence's end
 * @param {number|string} [rule.until] - inclusive end date (epoch ms or ISO)
 * @param {"weekly"|"monthly"} rule.frequency
 * @param {number} [rule.interval=1]
 * @param {number[]} [rule.byWeekday] - weekly only, 0..6 (0=Sunday)
 * @param {"day-of-month"|"weekday-of-month"} [rule.monthlyMode]
 * @param {number} [rule.monthlyDayOfMonth] - 1..31, used when monthlyMode === "day-of-month"
 * @param {number} [rule.monthlyWeekday] - 0..6, used when monthlyMode === "weekday-of-month"
 * @param {number} [rule.monthlyWeekdayOrdinal] - 1..5 (5 = last), used with weekday-of-month
 * @returns {Array<{start:number,end:number}>}
 */
export function generateBookingAttempts(rule) {
  if (!rule || typeof rule !== "object") return [];

  const seedStartDate = asDate(rule.seedStart);
  const seedEndDate = asDate(rule.seedEnd);
  if (!seedStartDate || !seedEndDate) return [];
  if (seedEndDate.getTime() <= seedStartDate.getTime()) return [];

  const duration = seedEndDate.getTime() - seedStartDate.getTime();
  const untilDate = rule.until != null ? asDate(rule.until) : null;
  const untilCutoff = untilDate
    ? new Date(
        untilDate.getFullYear(),
        untilDate.getMonth(),
        untilDate.getDate(),
        23,
        59,
        59,
        999
      ).getTime()
    : null;

  const interval = clampPositiveInt(rule.interval, 1);
  const frequency = rule.frequency === "monthly" ? "monthly" : "weekly";

  const occurrences = [];
  const push = (startDate) => {
    if (!startDate) return;
    const startMs = startDate.getTime();
    if (untilCutoff != null && startMs > untilCutoff) return;
    occurrences.push({ start: startMs, end: startMs + duration });
  };

  if (frequency === "weekly") {
    const weekdays = Array.isArray(rule.byWeekday)
      ? [...new Set(rule.byWeekday.map((d) => Number(d)).filter((d) => d >= 0 && d <= 6))]
          .sort((a, b) => a - b)
      : [seedStartDate.getDay()];

    if (weekdays.length === 0) {
      weekdays.push(seedStartDate.getDay());
    }

    const seedDayStart = startOfDay(seedStartDate);

    let weekIndex = 0;
    while (occurrences.length < MAX_OCCURRENCES) {
      const weekAnchor = new Date(seedDayStart);
      weekAnchor.setDate(weekAnchor.getDate() + weekIndex * interval * 7);

      let pushedAnyThisWeek = false;
      let anyInRangeThisWeek = false;
      for (const wd of weekdays) {
        const offset = (wd - weekAnchor.getDay() + 7) % 7;
        const candidate = new Date(weekAnchor);
        candidate.setDate(candidate.getDate() + offset);
        const start = cloneWithDate(seedStartDate, candidate);

        // Skip dates strictly before the seed start (only happens in week 0)
        if (start.getTime() < seedStartDate.getTime()) {
          continue;
        }
        if (untilCutoff != null && start.getTime() > untilCutoff) {
          continue;
        }
        anyInRangeThisWeek = true;
        push(start);
        pushedAnyThisWeek = true;
      }

      if (untilCutoff == null) {
        // Without an until-date we must stop. If no weekdays were configured
        // beyond the seed, one row was already pushed for week 0. We never
        // continue further.
        if (!pushedAnyThisWeek && weekIndex === 0) {
          push(cloneWithDate(seedStartDate, seedDayStart));
        }
        break;
      }

      const weekStartMs = weekAnchor.getTime();
      if (weekStartMs > untilCutoff && !anyInRangeThisWeek) break;

      weekIndex += 1;
    }

    return occurrences;
  }

  // Monthly
  const monthlyMode =
    rule.monthlyMode === "weekday-of-month" ? "weekday-of-month" : "day-of-month";

  if (monthlyMode === "day-of-month") {
    const targetDay = clampPositiveInt(
      rule.monthlyDayOfMonth ?? seedStartDate.getDate(),
      seedStartDate.getDate()
    );

    let monthIndex = 0;
    while (occurrences.length < MAX_OCCURRENCES) {
      const year = seedStartDate.getFullYear();
      const month = seedStartDate.getMonth() + monthIndex * interval;
      const monthYear = year + Math.floor(month / 12);
      const monthIdx = ((month % 12) + 12) % 12;
      const lastDay = lastDayOfMonth(monthYear, monthIdx);
      const day = Math.min(Math.max(targetDay, 1), lastDay);
      const dateOnly = new Date(monthYear, monthIdx, day);
      const start = cloneWithDate(seedStartDate, dateOnly);

      if (start.getTime() < seedStartDate.getTime()) {
        monthIndex += 1;
        continue;
      }
      if (untilCutoff != null && start.getTime() > untilCutoff) {
        break;
      }
      push(start);

      if (untilCutoff == null) break;
      monthIndex += 1;
    }

    return occurrences;
  }

  // weekday-of-month
  const weekday =
    rule.monthlyWeekday != null && Number(rule.monthlyWeekday) >= 0 && Number(rule.monthlyWeekday) <= 6
      ? Number(rule.monthlyWeekday)
      : seedStartDate.getDay();
  const ordinal = clampPositiveInt(rule.monthlyWeekdayOrdinal, 1);

  let monthIndex = 0;
  while (occurrences.length < MAX_OCCURRENCES) {
    const year = seedStartDate.getFullYear();
    const month = seedStartDate.getMonth() + monthIndex * interval;
    const monthYear = year + Math.floor(month / 12);
    const monthIdx = ((month % 12) + 12) % 12;
    const dateOnly = nthWeekdayOfMonth(monthYear, monthIdx, weekday, ordinal);
    if (!dateOnly) {
      if (untilCutoff == null) break;
      monthIndex += 1;
      continue;
    }
    const start = cloneWithDate(seedStartDate, dateOnly);
    if (start.getTime() < seedStartDate.getTime()) {
      monthIndex += 1;
      continue;
    }
    if (untilCutoff != null && start.getTime() > untilCutoff) {
      break;
    }
    push(start);

    if (untilCutoff == null) break;
    monthIndex += 1;
  }

  return occurrences;
}

/**
 * Convert a generated attempt list into a stable signature for caching the
 * validation result.
 */
export function attemptsSignature(attempts) {
  if (!Array.isArray(attempts) || attempts.length === 0) return "";
  return attempts.map((a) => `${a.start}-${a.end}`).join("|");
}

/** Weekday labels in ISO order (Mon..Sun) mapped to JS `getDay()` values. */
export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

export const ORDINAL_OPTIONS = [
  { value: 1, key: "first" },
  { value: 2, key: "second" },
  { value: 3, key: "third" },
  { value: 4, key: "fourth" },
  { value: 5, key: "last" },
];
