/**
 * The decision layer of both ways to a door: the scan landing page
 * (`/mobile-key/:tenant/:scanCode`), which reads it today, and the key list
 * (`/mobile-key`), which joins once its panel runs on the same flow.
 *
 * Everything here is pure: it turns server answers into the screen the person
 * in front of the door should see. The components own the wording, the calls
 * and the navigation; this module owns *which* screen, so the rules can be
 * read and tested without a browser.
 *
 * The screens speak the same vocabulary as the access audit
 * (`ACCESS_BLOCKING_REASONS` in the backend). A reason this module does not
 * know maps to a generic error - never to a silent success.
 */

/** The situations either way can end up in. */
export const ACCESS_ERRORS = Object.freeze({
  STALE_SCAN_CODE: "stale_scan_code",
  UNKNOWN_SCAN_CODE: "unknown_scan_code",
  NO_BOOKING: "no_booking",
  PAYMENT_REQUIRED: "payment_required",
  TOO_EARLY: "too_early",
  TOO_LATE: "too_late",
  DOOR_UNREACHABLE: "door_unreachable",
  OPEN_UNCONFIRMED: "open_unconfirmed",
  CLOSE_FAILED: "close_failed",
  STATUS_UNAVAILABLE: "status_unavailable",
  EVIDENCE_RULE_UNAVAILABLE: "evidence_rule_unavailable",
  EVIDENCE_INVALID: "evidence_invalid",
  EVIDENCE_MISSING: "evidence_missing",
  GENERIC: "generic",
});

/** The only scan-resolution reasons the page acts on. */
const RESOLUTION_SCREENS = Object.freeze({
  stale_scan_code: ACCESS_ERRORS.STALE_SCAN_CODE,
  unknown_scan_code: ACCESS_ERRORS.UNKNOWN_SCAN_CODE,
});

/** Blocking reasons that have a screen of their own, one to one. */
const REASON_SCREENS = Object.freeze({
  payment_required: ACCESS_ERRORS.PAYMENT_REQUIRED,
  evidence_rule_unavailable: ACCESS_ERRORS.EVIDENCE_RULE_UNAVAILABLE,
  evidence_invalid: ACCESS_ERRORS.EVIDENCE_INVALID,
  evidence_missing: ACCESS_ERRORS.EVIDENCE_MISSING,
});

/**
 * The screen for a blocking reason on its own. `outside_access_window` needs
 * the booking to tell "too early" from "too late", so it stays generic here -
 * see {@link decideBookingOutcome}.
 *
 * @param {string|null|undefined} reason A backend `ACCESS_BLOCKING_REASONS` value
 * @returns {string} An {@link ACCESS_ERRORS} value
 */
export function mapBlockingReason(reason) {
  return REASON_SCREENS[reason] || ACCESS_ERRORS.GENERIC;
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
    error: RESOLUTION_SCREENS[response?.data?.reason] || ACCESS_ERRORS.GENERIC,
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
      (candidate) =>
        blockedOutcome(candidate, now).error !== ACCESS_ERRORS.GENERIC,
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
    error: reasonError(reason, booking, now),
    booking,
    blockingReason: reason,
  };
}

/**
 * @private
 * The screen a blocking reason leads to, booking in hand: every reason but
 * `outside_access_window` can be read on its own.
 */
function reasonError(reason, booking, now) {
  return reason === "outside_access_window"
    ? windowError(booking, now)
    : mapBlockingReason(reason);
}

/**
 * @private
 * A closed window is either "not yet" or "over" - only the booking's own times
 * can say which, so without them the honest answer stays generic.
 */
function windowError(booking, now) {
  if (!booking?.timeBegin || !booking?.timeEnd) {
    return ACCESS_ERRORS.GENERIC;
  }
  return now < booking.timeBegin
    ? ACCESS_ERRORS.TOO_EARLY
    : ACCESS_ERRORS.TOO_LATE;
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
      error: ACCESS_ERRORS.TOO_EARLY,
      booking: upcoming[0],
      blockingReason: null,
    };
  }

  // Everything left is behind us - no third bucket to fall through into.
  const past = [...usable].sort((a, b) => b.timeEnd - a.timeEnd);
  if (past.length) {
    return {
      screen: "error",
      error: ACCESS_ERRORS.TOO_LATE,
      booking: past[0],
      blockingReason: null,
    };
  }

  return {
    screen: "error",
    error: ACCESS_ERRORS.NO_BOOKING,
    booking: null,
    blockingReason: null,
  };
}

/**
 * The one place in the frontend that assumes anything about an access-point
 * payload the backend does not send yet (see the payload contract): a door that
 * does not say what it demands behaves exactly as it does today - it demands a
 * scan and it can do all three actions.
 *
 * An empty list is *not* a missing one. `[]` is what a bypass and a locker
 * look like, and it has to survive: it is the fact that lets the flow skip the
 * evidence stage. Hence the check for `undefined` rather than for emptiness.
 *
 * `tenant` becomes `tenantId` and the old key goes: the field exists so the
 * scanner can compare tenants, never as the place to read the tenant from -
 * every caller passes it explicitly.
 *
 * @param {Object|null|undefined} raw An access point as the server sent it
 * @returns {{ id: string, label: string, type: string, mode: string,
 *   provider: string, tenantId: string|null, validationRuleTypes: string[],
 *   capabilities: string[] }}
 */
export function readAccessPoint(raw) {
  const { tenant, tenantId, validationRuleTypes, capabilities, ...rest } =
    raw ?? {};

  return {
    ...rest,
    tenantId: tenantId ?? tenant ?? null,
    validationRuleTypes:
      validationRuleTypes === undefined ? ["qrScan"] : validationRuleTypes,
    capabilities:
      capabilities === undefined
        ? ["open", "close", "getStatus"]
        : capabilities,
  };
}

/** The four fields a status answer is allowed to consist of. */
const STATUS_FIELDS = Object.freeze([
  "open",
  "locked",
  "doorOpen",
  "statusSource",
]);

/**
 * Reads the status answer down to its four named fields.
 *
 * `null` per field is not `false`: "the provider says nothing about it" is a
 * fact of its own. Provider-owned keys are dropped rather than passed on - as
 * long as they slip through, a template can branch on them again, which is the
 * disease this flow cures.
 *
 * An answer that carries none of the four fields, or none at all, is no status
 * either - and no status is never "closed".
 *
 * @param {{ success?: boolean, data?: Object }|Object|null|undefined} response
 * @returns {{ open: boolean|null, locked: boolean|null, doorOpen: boolean|null,
 *   statusSource: string|null }|null}
 */
export function readStatus(response) {
  if (response?.success === false) {
    return null;
  }

  const status = response?.data ?? response;
  if (!status || typeof status !== "object") {
    return null;
  }
  if (!STATUS_FIELDS.some((field) => field in status)) {
    return null;
  }

  return {
    open: status.open ?? null,
    locked: status.locked ?? null,
    doorOpen: status.doorOpen ?? null,
    statusSource: status.statusSource ?? null,
  };
}

/**
 * Reads the answer to a close. The status that comes back with it is the state
 * *after* closing, which the flow reports onwards - one roundtrip saved.
 *
 * Anything short of an explicit success is a close that did not happen: a
 * missing answer must never pass for a locked door.
 *
 * @param {{ success?: boolean, data?: Object }|null|undefined} response
 * @returns {{ closed: boolean, error: string|null,
 *   status: ReturnType<typeof readStatus> }} `status` as {@link readStatus} reads it
 */
export function readCloseOutcome(response) {
  return {
    closed: response?.success === true,
    error: response?.success === true ? null : ACCESS_ERRORS.CLOSE_FAILED,
    status: readStatus(response),
  };
}

/**
 * The body of the open request: the evidence travels along as the proof of
 * presence, and `channel` records for the audit that a QR scan is what stands
 * behind it. The scan page takes its evidence from the URL, the list from the
 * scanner in the panel - the request looks the same either way, which is why
 * the evidence comes in rather than a scan code.
 *
 * Without evidence the field stays out of the body entirely: an empty array is
 * still a claim, and this module makes none.
 *
 * @param {Object} [params]
 * @param {Object[]} [params.evidence] What proves presence at the door
 * @returns {{ channel: string, evidence?: Object[] }}
 */
export function buildOpenRequest({ evidence = [] } = {}) {
  return {
    channel: "qrScan",
    ...(evidence.length ? { evidence } : {}),
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
    error: reasonError(blockingReason, booking, now ?? Date.now()),
    blockingReason,
  };
}

/**
 * Reads the result of polling an asynchronous open. Nothing short of an
 * explicit confirmation opens the door, but the two ways of not being
 * confirmed are told apart, because they lead somewhere different:
 *
 * - the provider reported an error -> the door is unreachable, try again
 * - the poll ran out with nothing reported -> the open is *unconfirmed*; the
 *   box may well have sprung open, so the way out is "check the status", not
 *   a second open command
 *
 * `pollOpenStatus` stops the moment `confirmed`, `errorCode` or `errorMessage`
 * is set, so its last answer carries that distinction by itself.
 *
 * @param {{ data?: Object }|null|undefined} response Last poll answer
 * @returns {{ opened: boolean, error: string|null }}
 */
export function readOpenConfirmation(response) {
  const status = response?.data ?? response;

  if (status?.confirmed) {
    return { opened: true, error: null };
  }

  return {
    opened: false,
    error:
      isReported(status?.errorCode) || isReported(status?.errorMessage)
        ? ACCESS_ERRORS.DOOR_UNREACHABLE
        : ACCESS_ERRORS.OPEN_UNCONFIRMED,
  };
}

/**
 * @private
 * "Reported" for a field the provider may send as `null`, may leave out and may
 * fill with an empty string - none of which is a reported error.
 */
function isReported(value) {
  return value !== null && value !== undefined && value !== "";
}

/**
 * @private
 * "Standing open" for the purpose of the control button: the lock, not the
 * door contact. `doorOpen` says someone left it ajar, which is a fact for the
 * status screen and not a reason to offer locking from a phone.
 */
function isUnlocked(status) {
  return status?.open === true || status?.locked === false;
}

/** The nine situations either way can stand in, flat and complete. */
const STAGES = Object.freeze({
  LOADING: "loading",
  EVIDENCE: "evidence",
  CAN_OPEN: "can_open",
  CAN_CLOSE: "can_close",
  OPENING: "opening",
  CLOSING: "closing",
  OPENED: "opened",
  CLOSED: "closed",
  ERROR: "error",
});

/** The stepper's two ways, as the ids the wording in `de.json` hangs from. */
const SCAN_STEPS = Object.freeze(["verify", "open"]);
const OPEN_STEP = Object.freeze(["open"]);

/**
 * The one function that turns the facts of an open process into the stage in
 * front of the person at the door - the whole `v-if` chain of the old panel
 * body, on one axis instead of four.
 *
 * Two distinctions carry it:
 *
 * - **`status: undefined` is not `status: null`.** Undefined means nobody has
 *   read a status yet, which is a spinner; `null` is what {@link readStatus}
 *   returns when it read one and there was none, which is an error with a way
 *   out. Neither is an endless `loading`.
 * - **An error beats every other stage** - a booking that may not operate, or
 *   an action that came back refused, is an error and never `opening`. Only a
 *   confirmed open or close outranks it: the door is then open, whatever else
 *   is true.
 *
 * Where the evidence came from is none of its business: evidence from the scan
 * URL and evidence from the scanner in the panel are the same fact here. Only
 * the flow component knows whether it collected it itself, and only it needs
 * to - that is what the "proof provided" line on the button hangs from.
 *
 * `provider` is deliberately not a parameter: `capabilities` say what a door
 * can do and `type` says what to call it, which is all a provider stood for.
 *
 * @param {Object} facts
 * @param {ReturnType<typeof readStatus>|undefined} [facts.status] `undefined`
 *   while unread, `null` when unreadable
 * @param {Object[]} [facts.evidence] Proof of presence already in hand
 * @param {string[]} [facts.validationRuleTypes] What the door demands as proof
 * @param {string[]} [facts.capabilities] `open` / `close` / `getStatus`
 * @param {"open"|"close"|null} [facts.action] The action in flight
 * @param {Object|null} [facts.result] What {@link readOpenOutcome},
 *   {@link readOpenConfirmation} or {@link readCloseOutcome} made of its answer
 * @param {Object|null} [facts.booking] The booking behind the attempt
 * @param {number} [facts.now]
 * @returns {{ stage: "loading"|"evidence"|"can_open"|"can_close"|"opening"
 *   |"closing"|"opened"|"closed"|"error", steps: string[], currentStep: number,
 *   error: string|null, blockingReason: string|null }}
 */
export function decideStage({
  status,
  evidence,
  validationRuleTypes,
  capabilities,
  action = null,
  result = null,
  booking = null,
  now = Date.now(),
} = {}) {
  const able = capabilities || [];
  const demandsScan = (validationRuleTypes || []).includes("qrScan");
  // A demand is met by proof of its own kind - anything else is no answer to
  // the question the door asked.
  const evidenceMissing =
    demandsScan && !(evidence || []).some((item) => item?.type === "qrScan");

  // The stepper is a property of the way, not of the stage: a door that wants
  // a scan is a two-step affair from the first spinner on, and the step that
  // is due is the one still owing its evidence.
  const steps = demandsScan ? SCAN_STEPS : OPEN_STEP;
  const view = (stage, error = null, blockingReason = null) => ({
    stage,
    steps,
    currentStep: evidenceMissing ? 0 : steps.length - 1,
    error,
    blockingReason,
  });

  if (result?.error) {
    return view(STAGES.ERROR, result.error, result.blockingReason ?? null);
  }
  if (result?.opened) {
    return view(STAGES.OPENED);
  }
  if (result?.closed) {
    return view(STAGES.CLOSED);
  }

  // The server's eligibility is the authority on whether this booking may
  // operate at all - and it outranks a running action, because a spinner that
  // can only end in this very error is a spinner shown for nothing.
  if (booking?.accessEligibility?.canOperate === false) {
    const reason = booking.accessEligibility.primaryBlockingReason ?? null;
    return view(STAGES.ERROR, reasonError(reason, booking, now), reason);
  }

  if (action === "open") {
    return view(STAGES.OPENING);
  }
  if (action === "close") {
    return view(STAGES.CLOSING);
  }

  // A door that cannot report its state is not waited for; the button below
  // offers the only thing that stays honest without a status.
  if (able.includes("getStatus")) {
    if (status === undefined) {
      return view(STAGES.LOADING);
    }
    if (status === null) {
      return view(STAGES.ERROR, ACCESS_ERRORS.STATUS_UNAVAILABLE);
    }
  }

  if (isUnlocked(status)) {
    // An open door a provider cannot close is a result, not a control: the
    // status screen says so and offers opening again, never locking.
    return view(able.includes("close") ? STAGES.CAN_CLOSE : STAGES.OPENED);
  }

  return view(evidenceMissing ? STAGES.EVIDENCE : STAGES.CAN_OPEN);
}
