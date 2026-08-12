/**
 * The decision layer of the scan landing page (`/mobile-key/:tenant/:scanCode`).
 *
 * Everything here is pure: it turns server answers into the screen the person
 * in front of the door should see. The page component owns the wording, the
 * calls and the navigation; this module owns *which* screen, so the rules can
 * be read and tested without a browser.
 *
 * The screens speak the same vocabulary as the access audit
 * (`ACCESS_BLOCKING_REASONS` in the backend). A reason this module does not
 * know maps to a generic error - never to a silent success.
 */

/** The situations the landing page can end up in. */
export const SCAN_ERRORS = Object.freeze({
  STALE_SCAN_CODE: "stale_scan_code",
  UNKNOWN_SCAN_CODE: "unknown_scan_code",
  NO_BOOKING: "no_booking",
  PAYMENT_REQUIRED: "payment_required",
  TOO_EARLY: "too_early",
  TOO_LATE: "too_late",
  DOOR_UNREACHABLE: "door_unreachable",
  EVIDENCE_RULE_UNAVAILABLE: "evidence_rule_unavailable",
  EVIDENCE_INVALID: "evidence_invalid",
  EVIDENCE_MISSING: "evidence_missing",
  GENERIC: "generic",
});

/** The only scan-resolution reasons the page acts on. */
const RESOLUTION_SCREENS = Object.freeze({
  stale_scan_code: SCAN_ERRORS.STALE_SCAN_CODE,
  unknown_scan_code: SCAN_ERRORS.UNKNOWN_SCAN_CODE,
});

/** Blocking reasons that have a screen of their own, one to one. */
const REASON_SCREENS = Object.freeze({
  payment_required: SCAN_ERRORS.PAYMENT_REQUIRED,
  evidence_rule_unavailable: SCAN_ERRORS.EVIDENCE_RULE_UNAVAILABLE,
  evidence_invalid: SCAN_ERRORS.EVIDENCE_INVALID,
  evidence_missing: SCAN_ERRORS.EVIDENCE_MISSING,
});

/**
 * The screen for a blocking reason on its own. `outside_access_window` needs
 * the booking to tell "too early" from "too late", so it stays generic here -
 * see {@link decideBookingOutcome}.
 *
 * @param {string|null|undefined} reason A backend `ACCESS_BLOCKING_REASONS` value
 * @returns {string} A {@link SCAN_ERRORS} value
 */
export function mapBlockingReason(reason) {
  return REASON_SCREENS[reason] || SCAN_ERRORS.GENERIC;
}

/**
 * Reads the soft-fail envelope of `GET /api/:tenant/access/resolve-scan/:scanCode`.
 *
 * A body that is not a recognisable envelope counts as a failure: a sticker
 * must never open a door because the answer was unreadable.
 *
 * @param {{ success?: boolean, data?: Object }|null|undefined} response
 * @returns {{ accessPoint: Object|null, error: string|null }}
 */
export function readScanResolution(response) {
  if (response?.success === true && response.data?.id) {
    return { accessPoint: response.data, error: null };
  }

  return {
    accessPoint: null,
    error: RESOLUTION_SCREENS[response?.data?.reason] || SCAN_ERRORS.GENERIC,
  };
}

/**
 * Picks the booking the door should be opened with.
 *
 * `activeBookings` are the ones the server considers active right now
 * (buffered window, eligibility attached); `otherBookings` is the wider list
 * consulted only when nothing is active, so the page can say "not yet" or
 * "that was yesterday" instead of a bare "no booking".
 *
 * @param {Object} params
 * @param {string} params.accessPointId The scanned door
 * @param {string} params.tenantId Tenant from the scanned URL
 * @param {Object[]} [params.activeBookings]
 * @param {Object[]} [params.otherBookings]
 * @param {number} [params.now]
 * @returns {{ screen: "ready", booking: Object }
 *   | { screen: "select", bookings: Object[] }
 *   | { screen: "error", error: string, booking: Object|null, blockingReason: string|null }}
 */
export function decideBookingOutcome({
  accessPointId,
  tenantId,
  activeBookings = [],
  otherBookings = [],
  now = Date.now(),
}) {
  const belongsHere = (booking) =>
    String(booking?.tenantId) === String(tenantId) &&
    (booking?.accessPointIds || []).some(
      (id) => String(id) === String(accessPointId),
    );

  const candidates = activeBookings.filter(belongsHere);
  const openable = candidates.filter((booking) =>
    (booking.accessEligibility?.operableAccessPointIds || []).some(
      (id) => String(id) === String(accessPointId),
    ),
  );

  if (openable.length === 1) {
    return { screen: "ready", booking: openable[0] };
  }
  if (openable.length > 1) {
    return { screen: "select", bookings: openable };
  }
  if (candidates.length > 0) {
    // Several blocked bookings can sit on the same door at once. Prefer the
    // one the page has a real answer for over the first one in the list.
    const speaking = candidates.find(
      (candidate) => blockedOutcome(candidate, now).error !== SCAN_ERRORS.GENERIC,
    );
    return blockedOutcome(speaking ?? candidates[0], now);
  }

  return outOfWindowOutcome(otherBookings.filter(belongsHere), now);
}

/**
 * @private
 * The screen for an active booking that may not open this door.
 */
function blockedOutcome(booking, now) {
  const reason = booking.accessEligibility?.primaryBlockingReason ?? null;

  return {
    screen: "error",
    error:
      reason === "outside_access_window"
        ? windowError(booking, now)
        : mapBlockingReason(reason),
    booking,
    blockingReason: reason,
  };
}

/**
 * @private
 * A closed window is either "not yet" or "over" - only the booking's own times
 * can say which, so without them the honest answer stays generic.
 */
function windowError(booking, now) {
  if (!booking?.timeBegin || !booking?.timeEnd) {
    return SCAN_ERRORS.GENERIC;
  }
  return now < booking.timeBegin ? SCAN_ERRORS.TOO_EARLY : SCAN_ERRORS.TOO_LATE;
}

/**
 * @private
 * Nothing is active: name the nearest booking that explains why, preferring
 * the upcoming one - "come back at 18:00" is more useful than "yesterday".
 *
 * Rejected and uncommitted bookings are left out: pointing at one would
 * promise a door that will not open when its start time comes. Unpaid ones do
 * count, because "no booking at all" is the wrong thing to tell someone who
 * has one and still has time to pay for it.
 */
function outOfWindowOutcome(bookings, now) {
  const usable = bookings.filter(
    (booking) => booking.isCommitted !== false && booking.isRejected !== true,
  );

  const upcoming = usable
    .filter((booking) => booking.timeBegin > now)
    .sort((a, b) => a.timeBegin - b.timeBegin);
  if (upcoming.length) {
    return {
      screen: "error",
      error: SCAN_ERRORS.TOO_EARLY,
      booking: upcoming[0],
      blockingReason: null,
    };
  }

  // Everything left is behind us - no third bucket to fall through into.
  const past = [...usable].sort((a, b) => b.timeEnd - a.timeEnd);
  if (past.length) {
    return {
      screen: "error",
      error: SCAN_ERRORS.TOO_LATE,
      booking: past[0],
      blockingReason: null,
    };
  }

  return {
    screen: "error",
    error: SCAN_ERRORS.NO_BOOKING,
    booking: null,
    blockingReason: null,
  };
}

/**
 * The body of the open request: the scan itself is the presence evidence, and
 * `channel` records for the audit how the person got to this button.
 *
 * @param {string} scanCode The code from the scanned URL
 * @returns {{ evidence: Object[], channel: string }}
 */
export function buildScanOpenRequest(scanCode) {
  return {
    evidence: [{ type: "qrScan", scanCode }],
    channel: "qrScan",
  };
}

/**
 * Reads the soft-fail envelope of the open request. Same rule as the scan
 * resolution: only an explicit success counts as an open door.
 *
 * Every access point carries a scan code, lockers included, so a sticker can
 * lead to a provider that only acknowledges the command and confirms later.
 * Such an answer comes back as `pendingProcessId`, not as an open door - the
 * caller has to confirm it with {@link readOpenConfirmation}.
 *
 * Pass the booking to tell a window that closed while the ready screen sat
 * open ("too late") from one that had not opened yet ("too early").
 *
 * @param {{ success?: boolean, data?: Object }|null|undefined} response
 * @param {{ booking?: Object|null, now?: number }} [context]
 * @returns {{ opened: boolean, pendingProcessId: string|null, error: string|null, blockingReason: string|null }}
 */
export function readOpenOutcome(response, { booking = null, now } = {}) {
  if (response?.success === true) {
    const pendingProcessId = response.data?.openProcessId ?? null;
    return {
      opened: !pendingProcessId,
      pendingProcessId,
      error: null,
      blockingReason: null,
    };
  }

  const blockingReason = response?.data?.blockingReasons?.[0] ?? null;

  return {
    opened: false,
    pendingProcessId: null,
    error:
      blockingReason === "outside_access_window"
        ? windowError(booking, now ?? Date.now())
        : mapBlockingReason(blockingReason),
    blockingReason,
  };
}

/**
 * Reads the result of polling an asynchronous open. Anything short of an
 * explicit confirmation - a reported error, or a poll that ran out of
 * attempts - counts as a door that did not open.
 *
 * @param {{ data?: Object }|null|undefined} response Last poll answer
 * @returns {{ opened: boolean, error: string|null }}
 */
export function readOpenConfirmation(response) {
  const status = response?.data ?? response;

  return status?.confirmed
    ? { opened: true, error: null }
    : { opened: false, error: SCAN_ERRORS.DOOR_UNREACHABLE };
}
