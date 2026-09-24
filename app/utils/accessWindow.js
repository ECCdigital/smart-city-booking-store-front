/**
 * The Access Window, read the way the backend states it: the buffered span in
 * which a booking's doors may be operated, as epoch ms.
 *
 * Two shapes carry it (backend 4.3):
 *
 * - **Per door**, `accessFrom` / `accessTo` on `booking.accessPoints[]` - the
 *   truth for one row, since the buffer is the bookable's and doors of one
 *   booking may differ.
 * - **Per booking**, `accessEligibility.accessWindow: { from, to } | null` -
 *   the envelope (min start, max end over the doors), which is what "booking
 *   active" means. `null` where the booking has no doors; nothing here turns
 *   the booking's raw times into a window in its place.
 *
 * Pure, so the row wording, the list order and the clock's next boundary can
 * be tested without a browser. `now` is always a parameter: the clock
 * (`useAccessClock`) owns the current moment, this module only reads against
 * it.
 */

/** Where a moment stands relative to a window. */
export const ACCESS_WINDOW_STATES = Object.freeze({
  BEFORE: "before",
  DURING: "during",
  AFTER: "after",
});

/**
 * @private
 * A window is two finite instants or nothing; half a window would be a wrong
 * line rather than a missing one.
 */
function readWindow(from, to) {
  return Number.isFinite(from) && Number.isFinite(to) ? { from, to } : null;
}

/**
 * The door's own buffered window, or `null` where the door carries none.
 *
 * @param {Object|null|undefined} accessPoint
 * @returns {{ from: number, to: number }|null}
 */
export function doorWindow(accessPoint) {
  return readWindow(accessPoint?.accessFrom, accessPoint?.accessTo);
}

/**
 * The booking envelope from the eligibility, or `null` - also for a booking
 * that carries no eligibility at all.
 *
 * @param {Object|null|undefined} booking
 * @returns {{ from: number, to: number }|null}
 */
export function bookingWindow(booking) {
  const envelope = booking?.accessEligibility?.accessWindow;

  return readWindow(envelope?.from, envelope?.to);
}

/**
 * The door in the booking's access points, ids compared as strings (they
 * travel as numbers on one side and strings on the other).
 *
 * @param {Object|null|undefined} booking
 * @param {string|number} accessPointId
 * @returns {Object|null}
 */
export function findDoor(booking, accessPointId) {
  return (
    (booking?.accessPoints || []).find(
      (door) => String(door?.id) === String(accessPointId),
    ) ?? null
  );
}

/**
 * Before, during or after - `null` for no window. The start belongs to the
 * window and the end does not: the clock fires *at* a boundary, and what it
 * reads then must already be the far side, or every boundary would need a
 * second timer one tick later.
 *
 * @param {{ from: number, to: number }|null|undefined} window
 * @param {number} now
 * @returns {"before"|"during"|"after"|null}
 */
export function windowState(window, now) {
  if (!window) {
    return null;
  }
  if (now < window.from) {
    return ACCESS_WINDOW_STATES.BEFORE;
  }
  if (now >= window.to) {
    return ACCESS_WINDOW_STATES.AFTER;
  }

  return ACCESS_WINDOW_STATES.DURING;
}

/**
 * Whether the envelope contains `now` - "booking active" - or where it stands
 * otherwise. `null` for a booking without an envelope.
 *
 * @param {Object|null|undefined} booking
 * @param {number} now
 * @returns {"before"|"during"|"after"|null}
 */
export function bookingWindowState(booking, now) {
  return windowState(bookingWindow(booking), now);
}

/** Active first, then upcoming, then past; a booking without envelope last. */
const WINDOW_RANK = Object.freeze({
  [ACCESS_WINDOW_STATES.DURING]: 0,
  [ACCESS_WINDOW_STATES.BEFORE]: 1,
  [ACCESS_WINDOW_STATES.AFTER]: 2,
});
const NO_WINDOW_RANK = 3;

/**
 * The order of the key list: active, upcoming, past - active and upcoming by
 * start ascending (the next thing first), past by start descending (the most
 * recent first). Bookings without an envelope go last and keep the order
 * they came in; their raw times are not read.
 *
 * @param {number} now
 * @returns {(a: Object, b: Object) => number}
 */
export function compareByAccessWindow(now) {
  return (a, b) => {
    const windowA = bookingWindow(a);
    const windowB = bookingWindow(b);
    const stateA = windowState(windowA, now);
    const stateB = windowState(windowB, now);
    const rankA = stateA ? WINDOW_RANK[stateA] : NO_WINDOW_RANK;
    const rankB = stateB ? WINDOW_RANK[stateB] : NO_WINDOW_RANK;

    if (rankA !== rankB) {
      return rankA - rankB;
    }
    if (!windowA || !windowB) {
      return 0;
    }

    return stateA === ACCESS_WINDOW_STATES.AFTER
      ? windowB.from - windowA.from
      : windowA.from - windowB.from;
  };
}

/**
 * @private
 * Every boundary the visible doors have: each start and each end, unsorted.
 */
function boundaries(doors) {
  return (doors || []).flatMap((door) => {
    const window = doorWindow(door);

    return window ? [window.from, window.to] : [];
  });
}

/**
 * The next moment anything on the screen changes: the nearest start or end
 * strictly after `now` over all doors, or `null` when every boundary lies
 * behind. What the clock sets its one timeout on.
 *
 * @param {Object[]|null|undefined} doors Access points with `accessFrom` / `accessTo`
 * @param {number} now
 * @returns {number|null}
 */
export function nextBoundary(doors, now) {
  const ahead = boundaries(doors).filter((at) => at > now);

  return ahead.length ? Math.min(...ahead) : null;
}

/**
 * How many starts and ends lie between the last look (`since`, exclusive) and
 * `now` (inclusive). The clock reads this after its timeout and on every
 * return to the tab, where background throttling may have let several go by.
 *
 * @param {Object[]|null|undefined} doors
 * @param {number} since
 * @param {number} now
 * @returns {{ starts: number, ends: number }}
 */
export function crossedBoundaries(doors, since, now) {
  const crossed = (at) => at > since && at <= now;
  let starts = 0;
  let ends = 0;

  for (const door of doors || []) {
    const window = doorWindow(door);
    if (!window) {
      continue;
    }
    if (crossed(window.from)) {
      starts += 1;
    }
    if (crossed(window.to)) {
      ends += 1;
    }
  }

  return { starts, ends };
}

/**
 * Whether two instants fall on the same local calendar day - the day the
 * person in front of the door sees, which is why this is local and not UTC.
 *
 * @param {number} a epoch ms
 * @param {number} b epoch ms
 * @returns {boolean}
 */
export function sameLocalDay(a, b) {
  const dayA = new Date(a);
  const dayB = new Date(b);

  return (
    dayA.getFullYear() === dayB.getFullYear() &&
    dayA.getMonth() === dayB.getMonth() &&
    dayA.getDate() === dayB.getDate()
  );
}
