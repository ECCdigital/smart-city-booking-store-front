/**
 * How the fourteen failures of {@link ACCESS_ERRORS} look, and where each one
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

const bookablesPath = (tenantId) => `/t/${tenantId}/bookables`;

/**
 * The appearance of every failure.
 *
 * - `icon` / `color` go straight to `AccessPointStatusScreen`.
 * - `help` blends in `ProviderHelpSection`.
 * - `action` names the button under `mobileKey.actions`, and only rows that
 *   show a button of their own carry one.
 * - `retry` re-runs what failed (`"action"`) or just re-reads the status
 *   (`"status"`); `to` navigates instead. Never both - the way out of a case
 *   is one button, next to the context exit the caller renders.
 *
 * `retry: "action"` is the one that shows no button here. Saying it means the
 * command provably did not go through, so giving it again is harmless - which
 * is exactly what the control button under the screen does. That is also why
 * the two rows holding it are the two whose screen may pass and hand the
 * button back; `retry: "status"` marks the opposite case, where what is
 * missing is knowledge and the way out is a *different* command.
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
    to: ({ tenantId }) => (tenantId ? bookablesPath(tenantId) : null),
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
  },
  [ACCESS_ERRORS.TOO_LATE]: {
    icon: "i-lucide-moon",
    color: "neutral",
    action: "rebook",
    to: ({ tenantId, booking }) => {
      const leadBookableId = booking?.leadBookable?.id;
      return tenantId && leadBookableId
        ? `${bookablesPath(tenantId)}/${leadBookableId}`
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
  "locker_not_ready",
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
 * The whole screen for one failure: appearance from the table above, wording
 * from `de.json`, the way out only where it has somewhere to go.
 *
 * A way out without a destination - `payment_required` on a booking with no
 * id, `too_late` with no lead bookable - drops its button; the context exit
 * the caller renders carries the screen alone. So does a way out that is not
 * on this screen at all: the two `retry: "action"` rows name no `action`, and
 * `exit` stays null for them.
 *
 * @param {string} kind An {@link ACCESS_ERRORS} value; anything else is generic
 * @param {Object} context
 * @param {(key: string, params?: Object) => string} context.t vue-i18n's translator
 * @param {string} context.label The access point, by name - never a generic noun
 * @param {Object|null} [context.booking] The booking the failure is about
 * @param {string|null} [context.tenantId] Tenant the destinations stay inside
 * @param {string|null} [context.blockingReason] What the server named, if anything
 * @param {string|null} [context.date] Booking start, already formatted
 * @returns {{ icon: string, color: string, title: string, description: string,
 *   exit: { label: string, to: string|null, retry: string|null }|null }}
 */
export function buildErrorScreen(
  kind,
  { t, label, booking = null, tenantId = null, blockingReason = null, date = null },
) {
  const screenKind = ACCESS_ERROR_SCREENS[kind] ? kind : ACCESS_ERRORS.GENERIC;
  const row = ACCESS_ERROR_SCREENS[screenKind];
  const wording = `mobileKey.errors.${screenKind}`;

  return {
    icon: row.icon,
    color: row.color,
    title: t(`${wording}.title`, { label }),
    description: describeFailure(screenKind, {
      t,
      label,
      blockingReason,
      date,
      wording,
    }),
    exit: buildExit(row, { t, booking, tenantId }),
  };
}

/**
 * Conditional wording is two keys, and the choice is made here - `de.json`
 * carries sentences, not logic.
 */
function describeFailure(kind, { t, label, blockingReason, date, wording }) {
  if (kind === ACCESS_ERRORS.TOO_EARLY && !date) {
    return t(`${wording}.description_undated`);
  }

  if (kind === ACCESS_ERRORS.GENERIC) {
    return formatBlockingReasonMessage(
      blockingReason,
      t,
      t(`${wording}.description`, { label }),
    );
  }

  return t(`${wording}.description`, { label, date });
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
