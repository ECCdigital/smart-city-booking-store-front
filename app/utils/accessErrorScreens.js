/**
 * How the failures of {@link ACCESS_ERRORS} look, and where each one
 * lets the person in front of the door out again.
 *
 * The wording is not here - it lives in `i18n/locales/de.json` under
 * `mobileKey.errors`, keyed by the very same ids. This module carries only the
 * appearance and the destination, which is what lets it stay a plain module:
 * a single-file component cannot be imported in a Node test, and the pairing
 * of the three places - ids, table, wording - is exactly what
 * `tests/accessErrorScreens.test.js` guards.
 *
 * Guiding rule: a case earns a screen of its own through a way out of its own,
 * not through a reason of its own. That is why the six mute backend reasons
 * share `generic` - which still names them - and why every row carries at most
 * one way out. A way out need not be a button on the screen: where repeating
 * the failed command is the answer, the control button under the screen is
 * already that button, and the row shows none of its own.
 */

import { ACCESS_ERRORS } from "~/utils/accessOpenFlow.js";
import { bookingWindow, doorWindow, findDoor } from "~/utils/accessWindow.js";

const searchPath = (tenantId) => `/t/${tenantId}/search`;
const bookableDetailPath = (tenantId, bookableId) =>
  `/t/${tenantId}/bookables/${bookableId}`;

/**
 * One edge of the access a window screen names: the door's own Access Window
 * first, the booking envelope where the door is not known, the booking's raw
 * times as the last resort (a booking without eligibility, as the wider
 * scan-page query returns it).
 */
const accessEdge =
  (side, rawField) =>
  ({ booking = null, accessPointId = null }) => {
    const window =
      doorWindow(findDoor(booking, accessPointId)) ?? bookingWindow(booking);
    if (window) {
      return window[side];
    }

    const raw = booking?.[rawField];
    return Number.isFinite(raw) ? raw : null;
  };

/** From when the backend says another attempt can work (`readOpenOutcome`). */
const retryMoment = ({ retryAfter = null }) =>
  Number.isFinite(retryAfter) ? retryAfter : null;

/**
 * The appearance of every failure.
 *
 * - `icon` / `color` go straight to `AccessPointStatusScreen`.
 * - `help` opens the Provider Support Contact (`SupportContactLine`) that
 *   stands under every stage anyway; it decides "expanded", not "shown".
 * - `action` names the button under `mobileKey.actions`, and only rows that
 *   show a button of their own carry one.
 * - `retry` re-runs what failed (`"action"`) or just re-reads the status
 *   (`"status"`); `to` navigates instead. Never both - the way out of a case
 *   is one button, next to the context exit the caller renders.
 * - `moment` is the point in time the wording names where one is known: `at`
 *   finds it (epoch ms or `null`), `shows` says how it reads - `"date"` with
 *   its time, or `"time"`, the clock time, with the date where it is not
 *   today. `shows` is also the name of the parameter in `de.json`. A row with
 *   a moment carries `description_undated` for when none is known.
 *
 * `retry: "action"` is the one that shows no button here. Saying it means the
 * command provably did not go through, so giving it again is harmless - which
 * is exactly what the control button under the screen does. That is also why
 * the rows holding it are the ones whose screen may pass and hand the button
 * back; `retry: "status"` marks the opposite case, where what is missing is
 * knowledge and the way out is a *different* command.
 */
export const ACCESS_ERROR_SCREENS = Object.freeze({
  [ACCESS_ERRORS.STALE_SCAN_CODE]: {
    icon: "i-lucide-tag",
    color: "warning",
  },
  [ACCESS_ERRORS.UNKNOWN_SCAN_CODE]: {
    icon: "i-lucide-circle-help",
    color: "error",
  },
  [ACCESS_ERRORS.NO_BOOKING]: {
    icon: "i-lucide-search-x",
    color: "error",
    action: "book_now",
    to: ({ tenantId }) => (tenantId ? searchPath(tenantId) : null),
  },
  [ACCESS_ERRORS.PAYMENT_REQUIRED]: {
    icon: "i-lucide-credit-card",
    color: "error",
    action: "pay_now",
    to: ({ booking }) =>
      booking?.id ? `/account/bookings/${booking.id}` : null,
  },
  [ACCESS_ERRORS.TOO_EARLY]: {
    icon: "i-lucide-hourglass",
    color: "warning",
    moment: { at: accessEdge("from", "timeBegin"), shows: "date" },
  },
  [ACCESS_ERRORS.TOO_LATE]: {
    icon: "i-lucide-moon",
    color: "neutral",
    moment: { at: accessEdge("to", "timeEnd"), shows: "date" },
    action: "rebook",
    to: ({ tenantId, booking }) => {
      const leadBookableId = booking?.leadBookable?.id;
      return tenantId && leadBookableId
        ? bookableDetailPath(tenantId, leadBookableId)
        : null;
    },
  },
  [ACCESS_ERRORS.DOOR_UNREACHABLE]: {
    icon: "i-lucide-antenna",
    color: "error",
    // No button of its own: the command never reached the door, so repeating
    // it is harmless - and the control button under this screen is that repeat.
    retry: "action",
    help: true,
  },
  [ACCESS_ERRORS.OPEN_TEMPORARY]: {
    icon: "i-lucide-timer",
    color: "warning",
    // The backend's `openFailure: "temporary"`: the door refused this attempt
    // (a rejected one-time password, a lock offline) and may take the next
    // one. Not `door_unreachable` - "the connection on site" is wrong for a
    // rejected password. The way out is trying again a little later, which is
    // the control button that comes back once this screen has passed.
    retry: "action",
    help: true,
    // Minutes away as a rule, so the clock time says it.
    moment: { at: retryMoment, shows: "time" },
  },
  [ACCESS_ERRORS.OPEN_UNCONFIRMED]: {
    icon: "i-lucide-clock",
    color: "warning",
    action: "check_status",
    // Never "action": a second open command can latch an open door shut again.
    retry: "status",
    help: true,
  },
  [ACCESS_ERRORS.CLOSE_FAILED]: {
    icon: "i-lucide-unlock",
    color: "error",
    // No button of its own, for the same reason: the door stayed open, so
    // closing it again is the very command the control button gives.
    retry: "action",
    help: true,
  },
  [ACCESS_ERRORS.STATUS_UNAVAILABLE]: {
    icon: "i-lucide-wifi-off",
    color: "warning",
    action: "retry",
    retry: "status",
    help: true,
  },
  [ACCESS_ERRORS.EVIDENCE_RULE_UNAVAILABLE]: {
    icon: "i-lucide-wrench",
    color: "error",
    help: true,
  },
  [ACCESS_ERRORS.EVIDENCE_INVALID]: {
    icon: "i-lucide-tag",
    color: "warning",
  },
  [ACCESS_ERRORS.EVIDENCE_MISSING]: {
    icon: "i-lucide-scan-line",
    color: "warning",
  },
  [ACCESS_ERRORS.GENERIC]: {
    icon: "i-lucide-triangle-alert",
    color: "error",
    help: true,
  },
});

/**
 * Whether this failure's screen may pass by itself and hand the control button
 * back, instead of standing until someone acts on it.
 *
 * It is the same trait `retry: "action"` already names - the command provably
 * did not go through, so the button underneath repeats it - read out under a
 * name, so the flow can ask the table rather than branch on its contents. The
 * opposite case, `retry: "status"`, is knowledge that is missing: its screen
 * stays, because its way out is a *different* command than the button gives.
 *
 * @param {string} kind An {@link ACCESS_ERRORS} value
 * @returns {boolean}
 */
export function failureMayPass(kind) {
  return ACCESS_ERROR_SCREENS[kind]?.retry === "action";
}

/**
 * The backend reasons that have a sentence of their own. A reason that is not
 * listed keeps its silence rather than reaching a raw identifier through to
 * the screen.
 */
export const BLOCKING_REASONS = Object.freeze([
  "rejected",
  "not_committed",
  "payment_required",
  "authorization_revoked",
  "outside_access_window",
  "not_provisioned",
  "no_remote_access",
  "evidence_missing",
  "evidence_invalid",
  "evidence_rule_unavailable",
]);

/**
 * The sentence for the reason the server names, where it names one this side
 * knows. Takes the first of a list: the backend orders them by weight.
 *
 * @param {string[]|string|null|undefined} blockingReasons
 * @param {(key: string) => string} t vue-i18n's translator
 * @param {string} fallbackMessage Shown when no known reason is named
 * @returns {string}
 */
export function formatBlockingReasonMessage(
  blockingReasons,
  t,
  fallbackMessage,
) {
  const primary = Array.isArray(blockingReasons)
    ? blockingReasons[0]
    : blockingReasons;

  if (!primary || !BLOCKING_REASONS.includes(primary)) {
    return fallbackMessage;
  }

  return t(`mobileKey.blocking_reasons.${primary}`);
}

/**
 * The moment a screen names (see `moment` in {@link ACCESS_ERROR_SCREENS}):
 * for `too_early` when access begins, for `too_late` when it ended, for
 * `open_temporary` from when another attempt can work. `null` for every other
 * failure, and where nothing names a time - the screen then takes its undated
 * wording.
 *
 * @param {string} kind An {@link ACCESS_ERRORS} value
 * @param {{ booking?: Object|null, accessPointId?: string|number|null,
 *   retryAfter?: number|null }} [context] `retryAfter` in epoch ms, from
 *   `readOpenOutcome`
 * @returns {number|null} epoch ms
 */
export function errorScreenMoment(kind, context = {}) {
  return ACCESS_ERROR_SCREENS[kind]?.moment?.at(context) ?? null;
}

const sameDay = (a, b) =>
  new Date(a).toDateString() === new Date(b).toDateString();

/** The moment as its row says it reads, through the caller's formatters. */
function formatMoment(shows, moment, { now, format }) {
  return shows === "time" && sameDay(moment, now)
    ? format.formatTime(moment)
    : format.formatDate(moment);
}

/**
 * The whole screen for one failure: appearance from the table above, wording
 * from `de.json`, the way out only where it has somewhere to go.
 *
 * A way out without a destination - `payment_required` on a booking with no
 * id, `too_late` with no lead bookable - drops its button; the context exit
 * the caller renders carries the screen alone. So does a way out that is not
 * on this screen at all: the `retry: "action"` rows name no `action`, and
 * `exit` stays null for them.
 *
 * @param {string} kind An {@link ACCESS_ERRORS} value; anything else is generic
 * @param {Object} context
 * @param {(key: string, params?: Object) => string} context.t vue-i18n's translator
 * @param {string} context.label The access point, by name - never a generic noun
 * @param {Object|null} [context.booking] The booking the failure is about
 * @param {string|null} [context.tenantId] Tenant the destinations stay inside
 * @param {string|null} [context.blockingReason] What the server named, if anything
 * @param {string|number|null} [context.accessPointId] The door, for its own
 *   Access Window (see {@link errorScreenMoment})
 * @param {number|null} [context.retryAfter] From when to try again, epoch ms
 * @param {number} [context.now] epoch ms, to tell a time today from a later one
 * @param {{ formatDate: Function, formatTime: Function }} [context.format]
 *   `useFormatting()`, needed wherever a moment can be known
 * @returns {{ icon: string, color: string, title: string, description: string,
 *   summary: string,
 *   exit: { label: string, to: string|null, retry: string|null }|null }}
 *   `summary` is the screen in one line, for under the button once it passed
 */
export function buildErrorScreen(
  kind,
  {
    t,
    label,
    booking = null,
    tenantId = null,
    blockingReason = null,
    accessPointId = null,
    retryAfter = null,
    now = Date.now(),
    format = null,
  },
) {
  const screenKind = ACCESS_ERROR_SCREENS[kind] ? kind : ACCESS_ERRORS.GENERIC;
  const row = ACCESS_ERROR_SCREENS[screenKind];
  const wording = `mobileKey.errors.${screenKind}`;

  const moment = errorScreenMoment(screenKind, {
    booking,
    accessPointId,
    retryAfter,
  });
  const shows = row.moment?.shows;
  const when =
    moment === null
      ? null
      : { [shows]: formatMoment(shows, moment, { now, format }) };
  const title = t(`${wording}.title`, { label });

  return {
    icon: row.icon,
    color: row.color,
    title,
    description: describeFailure(screenKind, row, {
      t,
      label,
      blockingReason,
      when,
      wording,
    }),
    // Only a screen that passes leaves a line behind, so only such a row with
    // a moment carries `summary` in `de.json`.
    summary:
      when && failureMayPass(screenKind)
        ? t(`${wording}.summary`, { label, ...when })
        : title,
    exit: buildExit(row, { t, booking, tenantId }),
  };
}

/**
 * The screen a result leaves behind under the control button once it has
 * passed (→ {@link failureMayPass}), with what the result knew - the time to
 * try again among it. `null` for a success and for a failure whose screen
 * stays.
 *
 * @param {{ error?: string|null, retryAfter?: number }|null} result
 *   As `readOpenOutcome` and its siblings return it
 * @param {Object} context As for {@link buildErrorScreen}, without `retryAfter`
 * @returns {ReturnType<typeof buildErrorScreen>|null}
 */
export function passedFailureScreen(result, context) {
  const kind = result?.error ?? null;
  if (!kind || !failureMayPass(kind)) {
    return null;
  }

  return buildErrorScreen(kind, {
    ...context,
    retryAfter: result.retryAfter ?? null,
  });
}

/**
 * Conditional wording is two keys, and the choice is made here - `de.json`
 * carries sentences, not logic.
 */
function describeFailure(kind, row, { t, label, blockingReason, when, wording }) {
  if (row.moment && !when) {
    return t(`${wording}.description_undated`, { label });
  }

  if (kind === ACCESS_ERRORS.GENERIC) {
    return formatBlockingReasonMessage(
      blockingReason,
      t,
      t(`${wording}.description`, { label }),
    );
  }

  return t(`${wording}.description`, { label, ...when });
}

function buildExit(row, { t, booking, tenantId }) {
  if (!row.action) {
    return null;
  }

  const to = row.to ? row.to({ booking, tenantId }) : null;

  if (!row.retry && !to) {
    return null;
  }

  return {
    label: t(`mobileKey.actions.${row.action}`),
    to,
    retry: row.retry ?? null,
  };
}
