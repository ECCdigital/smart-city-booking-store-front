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
 * @private
 * Whether a list of access point ids names this door. Ids travel as strings
 * on one side and as numbers on the other; a list nobody sent names nothing.
 */
function namesDoor(ids, accessPointId) {
  return (ids || []).some((id) => String(id) === String(accessPointId));
}

/**
 * Whether this booking may open this door through the API right now - the set
 * `open` is checked against in the backend (`remoteOperableAccessPointIds`,
 * backend 4.3). A door that only takes a code is *operable* (close, status)
 * but not this, and the button that would only fail is not offered for it.
 *
 * **Fail-closed:** an eligibility that names no remote-operable list at all
 * makes nothing remote-operable. Reading the wider `operableAccessPointIds`
 * in its place would be the dual support this storefront does not carry.
 *
 * @param {Object|null|undefined} booking A booking with its `accessEligibility`
 * @param {string|number} accessPointId The door
 * @returns {boolean}
 */
export function remoteOperable(booking, accessPointId) {
  return namesDoor(
    booking?.accessEligibility?.remoteOperableAccessPointIds,
    accessPointId,
  );
}

/**
 * The reason against opening *this* door, where the booking's
 * `primaryBlockingReason` speaks for the booking as a whole. Same rule as the
 * backend's `open` (`_openGuarded`): a door that is not operable is blocked
 * for the booking's own reason; one that is operable but not remote-operable
 * is a code door, and the reason is `no_remote_access`.
 *
 * @param {Object|null|undefined} booking A booking with its `accessEligibility`
 * @param {string|number} accessPointId The door
 * @returns {string|null} A backend `ACCESS_BLOCKING_REASONS` value, `null`
 *   where nothing speaks against opening - or where there is no eligibility
 *   to read one from
 */
export function doorBlockingReason(booking, accessPointId) {
  const eligibility = booking?.accessEligibility;
  if (!eligibility) {
    return null;
  }
  if (!namesDoor(eligibility.operableAccessPointIds, accessPointId)) {
    return eligibility.primaryBlockingReason ?? null;
  }
  if (!remoteOperable(booking, accessPointId)) {
    return "no_remote_access";
  }

  return null;
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
  // Openable through the API, not merely operable: a code door with a grant
  // is operable and would still refuse the open - see `remoteOperable`.
  const openable = candidates.filter((booking) =>
    remoteOperable(booking, accessPointId),
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
        blockedOutcome(candidate, accessPointId, now).error !==
        ACCESS_ERRORS.GENERIC,
    );
    return blockedOutcome(speaking ?? candidates[0], accessPointId, now);
  }

  return outOfWindowOutcome(otherBookings.filter(belongsHere), now);
}

/**
 * @private
 * The screen for an active booking that may not open this door - for the
 * door's own reason, which for a code door is `no_remote_access` rather than
 * anything the booking as a whole says.
 */
function blockedOutcome(booking, accessPointId, now) {
  const reason = doorBlockingReason(booking, accessPointId);

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
 * The one place an access-point payload enters the flow, and the place a future
 * change of its form lands.
 *
 * **What a door demands and what it can do are read, never guessed.** A payload
 * missing either is refused rather than normalised: a door read as demanding
 * nothing is a door opened without the proof it asked for, which is the one
 * failure this flow may not have. The callers turn the refusal into an error
 * screen - the person in front of the door is told, not waved through.
 *
 * An empty list is *not* a missing one. `[]` is what a bypass and a locker
 * look like, and it has to survive: it is the fact that lets the flow skip the
 * evidence stage. Hence the check for a list rather than for content.
 *
 * `tenant` becomes `tenantId` and the old key goes: the field exists so the
 * scanner can compare tenants, never as the place to read the tenant from -
 * every caller passes it explicitly.
 *
 * `validationRuleTypes` stays the one source of what a door demands. Backend
 * 4.3 also puts `demandedEvidence[id]` and `evidenceWaived` on the booking's
 * eligibility, but the projection already is that lookup - the same values,
 * and for a waived person an empty list - and the scan page has no booking to
 * read them from. A second reader would be a duplicate with one road that
 * lacks it, so neither field is read here.
 *
 * @param {Object|null|undefined} raw An access point as the server sent it
 * @returns {{ id: string, label: string, type: string, mode: string,
 *   provider: string, tenantId: string|null, validationRuleTypes: string[],
 *   capabilities: string[] }|null} `null` where the payload is no access point
 */
export function readAccessPoint(raw) {
  const { tenant, tenantId, validationRuleTypes, capabilities, ...rest } =
    raw ?? {};

  if (!Array.isArray(validationRuleTypes) || !Array.isArray(capabilities)) {
    return null;
  }

  return {
    ...rest,
    tenantId: tenantId ?? tenant ?? null,
    validationRuleTypes,
    capabilities,
  };
}

/**
 * Whether a door can be asked for its state. The one place the `getStatus`
 * capability is spelled: the flow, the list and {@link decideStage} all skip
 * the same doors - a locker at rest declares `open` alone and would answer a
 * status request with four nulls.
 *
 * @param {{ capabilities?: string[] }|null|undefined} accessPoint
 * @returns {boolean}
 */
export function canReportStatus(accessPoint) {
  return Boolean(accessPoint?.capabilities?.includes("getStatus"));
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
 * The state a succeeded command leaves behind, for the doors that cannot be
 * asked. `readCloseOutcome` already hands back the status that travelled with
 * the close answer; this is the same knowledge for every other case - a door
 * without `getStatus`, or one whose status read failed - where the command's
 * own success is the only thing anyone knows about the door.
 *
 * It claims the one field the command proves and no more: `locked` and
 * `doorOpen` are the provider's to report, and a command that opened a door
 * says nothing about a bolt or a hinge. `statusSource` says where this came
 * from, so nobody downstream mistakes it for a reading.
 *
 * @param {{ open: boolean }} params What the command established
 * @returns {ReturnType<typeof readStatus>}
 */
export function buildCommandStatus({ open }) {
  return {
    open,
    locked: null,
    doorOpen: null,
    statusSource: "command_result",
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
      isStated(status?.errorCode) || isStated(status?.errorMessage)
        ? ACCESS_ERRORS.DOOR_UNREACHABLE
        : ACCESS_ERRORS.OPEN_UNCONFIRMED,
  };
}

/**
 * @private
 * A field the sender may leave out, may send as `null` and may fill with an
 * empty string states nothing in all three cases - neither a reported error nor
 * a tenant to compare against.
 */
function isStated(value) {
  return value !== null && value !== undefined && value !== "";
}

/**
 * What a sticker carries (#5): the landing page's own URL, tenant and scan code
 * in its path. Nothing else on it is part of the code - a campaign parameter
 * appended to the printed link must not change what gets resolved.
 */
const SCAN_URL = /\/mobile-key\/([^/?#]+)\/([^/?#]+)\/?(?:[?#]|$)/;

/**
 * Reads a decoded QR code back into the two things the scanner needs: **which
 * tenant to resolve against** - the scanned one, never the panel's own, or a
 * foreign sticker could never be told apart from an unreadable one - and the
 * code to resolve.
 *
 * `path` is the way out of a wrong door: the sticker's own path, so the jump to
 * the scanned door lands on the landing page, which resolves the booking for it
 * (#18). It travels along because the component may not take a scan apart.
 *
 * A code without that path is no code at all here: resolving anything a camera
 * happened to see would ask the server about wifi credentials. **The host is
 * deliberately not checked** - the store front answers under a tenant's own
 * domain as well as under the shared one, and a sticker printed with the other
 * one is still the same sticker. Nothing foreign is reached either way: the
 * code is resolved against this app's own API, and the jump stays in-app.
 *
 * @param {string|null|undefined} rawValue The string as the decoder read it
 * @returns {{ tenant: string, scanCode: string, path: string }|null}
 */
export function readScannedCode(rawValue) {
  const match = SCAN_URL.exec(rawValue || "");
  if (!match) {
    return null;
  }

  const [, tenant, scanCode] = match;

  return { tenant, scanCode, path: `/mobile-key/${tenant}/${scanCode}` };
}

/**
 * The three ways a scan can fail to be the proof, kept apart because their ways
 * out differ - not {@link ACCESS_ERRORS} values: all three stay inside the
 * evidence stage, where the scanner keeps running.
 */
const SCAN_MISMATCHES = Object.freeze({
  WRONG_DOOR: "wrong_door",
  WRONG_TENANT: "wrong_tenant",
  UNREADABLE: "unreadable",
});

/**
 * The comparison the scanner in the panel hangs from: does the code just
 * scanned belong to the door the panel currently has open?
 *
 * The scanner resolves the decoded code against the server and hands the answer
 * here; **a door's `scanCode` never reaches the client** - would it, the proof
 * would be void, because then the phone could compare against something it was
 * given rather than against something it read at the door.
 *
 * The comparison lives here rather than in the scanner component for the same
 * reason everything else in this module does: "deliver a picture" and "decode a
 * picture" are separate jobs, and this one only ever sees the decoded string.
 *
 * The wrong door offers a jump to the scanned one - hence `scannedLabel`, which
 * names it - a foreign tenant offers nothing, because a jump there would be an
 * arrival at a stranger's tenant, and an unreadable answer is no answer at all.
 * The tenant therefore outranks the door: both are misses, but only one of them
 * may be jumped to.
 *
 * **Both sides have to name their tenant.** `resolve-scan` sends `tenantId`,
 * so an answer without one is a broken answer, not a comparison to be waived:
 * a side nobody can name is a miss. Anything short of a readable payload never
 * gets that far - {@link readAccessPoint} refuses it, and a refusal is
 * `unreadable`, which is what an answer this module cannot read is.
 *
 * @param {{ success?: boolean, data?: Object }|null|undefined} response
 *   The answer to `GET /api/:tenant/access/resolve-scan/:scanCode`
 * @param {Object} expectation
 * @param {string} [expectation.expectedAccessPointId] The door standing open in the panel
 * @param {string} [expectation.expectedTenantId] The tenant that panel belongs to
 * @param {string} [expectation.scanCode] The code as it was decoded from the sticker
 * @returns {{ matched: boolean, evidence: Object[],
 *   mismatch: null|"wrong_door"|"wrong_tenant"|"unreadable",
 *   scannedLabel: string|null }}
 */
export function decideScanMatch(
  response,
  { expectedAccessPointId, expectedTenantId, scanCode } = {},
) {
  // Nothing decoded means nothing to hand upwards as proof, and evidence
  // without a code is precisely the fake this flow exists to remove.
  if (!isStated(scanCode)) {
    return noMatch(SCAN_MISMATCHES.UNREADABLE, null);
  }

  const { accessPoint } = readScanResolution(response);
  if (!accessPoint) {
    return noMatch(SCAN_MISMATCHES.UNREADABLE, null);
  }

  const scanned = readAccessPoint(accessPoint);
  if (!scanned) {
    return noMatch(SCAN_MISMATCHES.UNREADABLE, null);
  }

  const label = scanned.label ?? null;

  if (!sameId(scanned.tenantId, expectedTenantId)) {
    return noMatch(SCAN_MISMATCHES.WRONG_TENANT, label);
  }
  if (!sameId(scanned.id, expectedAccessPointId)) {
    return noMatch(SCAN_MISMATCHES.WRONG_DOOR, label);
  }

  return {
    matched: true,
    evidence: [{ type: "qrScan", scanCode }],
    mismatch: null,
    scannedLabel: label,
  };
}

/**
 * @private
 * No match means no evidence: an empty list is the only honest answer, since
 * anything in it would be a claim of proof this comparison just refused.
 */
function noMatch(mismatch, scannedLabel) {
  return { matched: false, evidence: [], mismatch, scannedLabel };
}

/**
 * @private
 * Ids travel as strings on one side and as numbers on the other; a missing one
 * is never equal to anything, not even to another missing one - a comparison
 * nobody can make is a miss, never a match.
 */
function sameId(a, b) {
  return isStated(a) && isStated(b) && String(a) === String(b);
}

/**
 * @private
 * "Standing open" for the purpose of the control button: the lock, not the
 * door contact. `doorOpen` says someone left it ajar, which is a fact for the
 * status screen and not a reason to offer locking from a phone.
 */
/**
 * Whether a status reads as an open door. Exported because the flow has to ask
 * the same question outside `decideStage` - whether a reading agrees with the
 * command that was just given - and two places answering it their own way is
 * how a button ends up pointing one way while the stage points the other.
 *
 * **`open` outranks `locked`.** It is the lock's answer to this very question -
 * "does the lock grant access" - while `locked` is the narrower fact of a bolt
 * being thrown, and only stands in where `open` says nothing. Reading them as
 * equals made every turning lock report an open door: a Nuki sets `locked` from
 * `lockStateCode === 1` alone, so *locking* (code 4) answers `locked: false`
 * just as *unlocking* (code 2) does. Openings survived that by luck - the
 * mid-turn reading matched where they were headed - and closings did not: the
 * button came back saying "close" for a door that was closing.
 *
 * @param {ReturnType<typeof readStatus>} status
 * @returns {boolean}
 */
export function isUnlocked(status) {
  if (typeof status?.open === "boolean") {
    return status.open;
  }

  return status?.locked === false;
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
 * @param {string[]} facts.validationRuleTypes What the door demands as proof -
 *   anything but a list is an error, never a door that demands nothing
 * @param {string[]} facts.capabilities `open` / `close` / `getStatus`
 * @param {"open"|"close"|null} [facts.action] The action in flight
 * @param {Object|null} [facts.result] What {@link readOpenOutcome},
 *   {@link readOpenConfirmation} or {@link readCloseOutcome} made of its answer
 * @param {Object|null} [facts.booking] The booking behind the attempt
 * @param {string|number} [facts.accessPointId] The door in front of the
 *   person, so the eligibility can be read for *this* door (backend 4.3 names
 *   the remote-operable ones): a code door stands on `error` with
 *   `no_remote_access` before any button. Without it the booking-level
 *   `canOperate` is all there is to read
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
  accessPointId,
  now = Date.now(),
} = {}) {
  // Both lists are facts, never defaults: one nobody stated is not a door
  // demanding nothing. `readAccessPoint` refuses such a payload at the
  // boundary - this is the same refusal for anyone who reaches the stage
  // decision by another road, so the rule lives here and not in a template.
  if (!Array.isArray(validationRuleTypes) || !Array.isArray(capabilities)) {
    return {
      stage: STAGES.ERROR,
      steps: OPEN_STEP,
      currentStep: 0,
      error: ACCESS_ERRORS.GENERIC,
      blockingReason: null,
    };
  }

  const able = capabilities;
  const demandsScan = validationRuleTypes.includes("qrScan");
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
  // can only end in this very error is a spinner shown for nothing. Given the
  // door, the eligibility is read for that door: a code door is operable and
  // still refuses the open, and the button it would get could only fail.
  if (booking?.accessEligibility) {
    if (isStated(accessPointId)) {
      if (!remoteOperable(booking, accessPointId)) {
        const reason = doorBlockingReason(booking, accessPointId);
        return view(STAGES.ERROR, reasonError(reason, booking, now), reason);
      }
    } else if (booking.accessEligibility.canOperate === false) {
      const reason = booking.accessEligibility.primaryBlockingReason ?? null;
      return view(STAGES.ERROR, reasonError(reason, booking, now), reason);
    }
  }

  if (action === "open") {
    return view(STAGES.OPENING);
  }
  if (action === "close") {
    return view(STAGES.CLOSING);
  }

  // A door that cannot report its state is not waited for; the button below
  // offers the only thing that stays honest without a status.
  if (canReportStatus({ capabilities })) {
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
