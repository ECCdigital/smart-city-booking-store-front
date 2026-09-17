import { isUnlocked } from "~/utils/accessOpenFlow.js";
import {
  ACCESS_WINDOW_STATES,
  doorWindow,
  sameLocalDay,
  windowState,
} from "~/utils/accessWindow.js";

/**
 * How an access point is shown, wherever it is shown: what it is called, and
 * whether the person has to do anything at the door itself. Two places render
 * this - the row in `AccessPointListRow.vue` and the card in
 * `AccessPointCard.vue` - in two different shapes, but they must never
 * disagree about the facts.
 *
 * The lock symbol below belongs to the row alone. The card draws its own from
 * the *stage* it stands over (`AccessPointOpenFlow.vue`), which is a second
 * reading of the same door only by appearance: inside the flow, a door nobody
 * has read yet is the `loading` stage, so the card never needs the third state
 * the row needs. The two share the colours by coincidence today, and if that
 * ever has to become a shared fact, it moves here.
 *
 * A pure module rather than a component, for the same reason
 * `accessErrorScreens.js` is one: an SFC cannot be imported in a Node test.
 * That is also why the lock states carry an i18n *key* rather than a word:
 * the module has no `t()`, the renderer does.
 */

/**
 * A locker has no label of its own, so it is named by the number on the box
 * (`compartment`, backend 4.3) - the one the person looks for at the site -
 * and only where the provider names none by the booking behind it. Before the
 * grant an unpaid booking knows neither, and a box on hold is still a box, not
 * a `#null`. Which kind it is comes from `type` (#13, #15) - the provider does
 * not decide how a thing is called. A door from a provider nobody enumerated
 * still gets a name, rather than the empty row the old label left behind.
 */
export function accessPointTitle(accessPoint) {
  if (accessPoint?.type === "locker") {
    if (accessPoint.compartment) {
      return `Fahrradbox Nr. ${accessPoint.compartment}`;
    }

    if (accessPoint.externalBookingId) {
      return `Fahrradbox #${accessPoint.externalBookingId}`;
    }

    return "Fahrradbox";
  }

  return accessPoint?.label || "Unbekannte Tür";
}

/**
 * Whether the person has to enter a code at the door itself. Keyed by the
 * backend's `mode` (`remote | authorization | both`): `authorization` is the
 * backend's word for a door that takes a code or a card; `code` never came
 * from any backend, but the alias costs nothing and is not made wrong by it.
 * A `both` door is opened by the button - the code is a second way, not an
 * instruction - so it gets no hint either.
 *
 * A missing or unknown mode answers `false`: a hint is an instruction, and
 * sending someone to a keypad this module cannot vouch for is worse than
 * saying nothing. The row used to wear an "Unbekannter Modus" badge for that
 * case; a fact nobody can act on has no place in the row.
 */
export function needsCodeAtDoor(accessPoint) {
  const mode = accessPoint?.mode;

  return mode === "authorization" || mode === "code";
}

/**
 * The one line a row says about its Access Window, chosen by where `now`
 * stands: before it "Zugang ab {from}", during it "Zugang möglich bis {to}",
 * after it "Zugang endete um {to}" (`mobileKey.accessPoint.window.*`). The
 * moment named is the start before the window and the end from then on.
 *
 * `withDate` says whether the renderer has to spell out the day: a moment on
 * the same local day as `now` is stated by its time alone, any other day with
 * its date. The full "von … bis …" form stays the row's title and is not
 * decided here.
 *
 * A door without window fields gets no line - a row without a window says
 * nothing rather than something invented from the booking's raw times.
 *
 * @param {Object|null|undefined} accessPoint With `accessFrom` / `accessTo`
 * @param {number} now
 * @returns {{ state: "before"|"during"|"after", at: number, withDate: boolean }|null}
 */
export function accessWindowLine(accessPoint, now) {
  const window = doorWindow(accessPoint);
  const state = windowState(window, now);
  if (!state) {
    return null;
  }

  const at = state === ACCESS_WINDOW_STATES.BEFORE ? window.from : window.to;

  return { state, at, withDate: !sameLocalDay(at, now) };
}

/**
 * The symbol on a row that says how the door stands. It has *three* things to
 * say, not two: a padlock drawn before anyone asked is a claim nobody checked,
 * and the list used to draw one for every door on every first paint.
 *
 * `unknown` deliberately merges the two ways of knowing nothing - nobody has
 * asked yet, and the provider answered without saying. The distinction is real
 * inside the open flow, where it separates a spinner from an error
 * (`decideStage`), but a row in a list has no move to make either way: it
 * neither waits for the person nor asks them for anything, so one quiet symbol
 * covers both. It carries no motion for the same reason - a spinner per door
 * would be noise for a fact nobody came here to read (#12).
 */
export const ACCESS_POINT_LOCK_STATES = Object.freeze({
  open: Object.freeze({
    labelKey: "mobileKey.accessPoint.lockState.open",
    color: "text-green-600",
    background: "bg-green-600/10",
    icon: "i-lucide-unlock",
  }),
  closed: Object.freeze({
    labelKey: "mobileKey.accessPoint.lockState.closed",
    color: "text-primary",
    background: "bg-primary/10",
    icon: "i-lucide-lock",
  }),
  unknown: Object.freeze({
    labelKey: "mobileKey.accessPoint.lockState.unknown",
    color: "text-neutral-400",
    background: "bg-neutral-400/10",
    icon: "i-lucide-circle-dashed",
  }),
});

/**
 * Which of the three a status reads as. Only the gate is decided here - whether
 * any answer to the question arrived at all; open-or-closed is left to
 * {@link isUnlocked}, which owns the ranking of `open` over `locked` and paid
 * for it (#07). A second opinion about that here is how a symbol ends up
 * pointing one way while the button in the same row points the other.
 *
 * @param {ReturnType<typeof import("./accessOpenFlow.js").readStatus>|undefined} status
 *   `undefined` for a door nobody has asked about yet, `null` for a read that
 *   found no status.
 */
export function accessPointLock(status) {
  const answered =
    typeof status?.open === "boolean" || typeof status?.locked === "boolean";

  if (!answered) {
    return ACCESS_POINT_LOCK_STATES.unknown;
  }

  return isUnlocked(status)
    ? ACCESS_POINT_LOCK_STATES.open
    : ACCESS_POINT_LOCK_STATES.closed;
}
