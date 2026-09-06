import { isUnlocked } from "~/utils/accessOpenFlow.js";

/**
 * How an access point is shown, wherever it is shown: what it is called, and
 * the badge that says how it opens. Two places render this - the row in
 * `MobileKeyBookingList.vue` and the card in `AccessPointCard.vue` - in two
 * different shapes, but they must never disagree about the words.
 *
 * The lock symbol below belongs to the row alone. The card draws its own from
 * the *stage* it stands over (`AccessPointOpenFlow.vue:309`), which is a second
 * reading of the same door only by appearance: inside the flow, a door nobody
 * has read yet is the `loading` stage, so the card never needs the third state
 * the row needs. The two share the colours by coincidence today, and if that
 * ever has to become a shared fact, it moves here.
 *
 * A pure module rather than a component, for the same reason
 * `accessErrorScreens.js` is one: an SFC cannot be imported in a Node test.
 * The wording stays hard German here rather than moving to `de.json`, like the
 * rest of the list does - see the note on `blockingReasonLabels`.
 */

const CODE_DOOR = Object.freeze({
  label: "Code an der Tür",
  color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
  icon: "i-lucide-key-round",
});

/**
 * Keyed by the backend's `mode` (`remote | authorization | both`). `code`
 * never came from any backend, but the key costs nothing and is not made
 * wrong by `authorization` - it stays as an alias.
 */
export const ACCESS_POINT_MODES = Object.freeze({
  remote: Object.freeze({
    label: "Per Knopf",
    color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    icon: "i-lucide-lock-open",
  }),
  authorization: CODE_DOOR,
  code: CODE_DOOR,
  // The button works here as well, so it wears the button's colours.
  both: Object.freeze({
    label: "Per Knopf oder Code",
    color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    icon: "i-lucide-lock-open",
  }),
});

export const UNKNOWN_MODE = Object.freeze({
  label: "Unbekannter Modus",
  color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  icon: "i-lucide-alert-triangle",
});

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

/** An unknown mode is named as unknown, never silently left blank. */
export function accessPointMode(accessPoint) {
  return ACCESS_POINT_MODES[accessPoint?.mode] || UNKNOWN_MODE;
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
    label: "Offen",
    color: "text-green-600",
    background: "bg-green-600/10",
    icon: "i-lucide-unlock",
  }),
  closed: Object.freeze({
    label: "Zu",
    color: "text-primary",
    background: "bg-primary/10",
    icon: "i-lucide-lock",
  }),
  unknown: Object.freeze({
    label: "Zustand unbekannt",
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
