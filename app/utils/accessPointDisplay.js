/**
 * How an access point is shown, wherever it is shown: what it is called, and
 * the badge that says how it opens. Two places render this - the row in
 * `MobileKeyBookingList.vue` and the card in `AccessPointCard.vue` - in two
 * different shapes, but they must never disagree about the words.
 *
 * A pure module rather than a component, for the same reason
 * `accessErrorScreens.js` is one: an SFC cannot be imported in a Node test.
 * The wording stays hard German here rather than moving to `de.json`, like the
 * rest of the list does - see the note on `blockingReasonLabels`.
 */

export const ACCESS_POINT_MODES = Object.freeze({
  remote: Object.freeze({
    label: "Per Knopf",
    color: "bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100",
    icon: "i-lucide-lock-open",
  }),
  code: Object.freeze({
    label: "Code an der Tür",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100",
    icon: "i-lucide-key-round",
  }),
});

export const UNKNOWN_MODE = Object.freeze({
  label: "Unbekannter Modus",
  color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100",
  icon: "i-lucide-alert-triangle",
});

/**
 * A locker has no name a person would recognise, so it is named by the booking
 * behind it. Which kind it is comes from `type` (#13, #15) - the provider does
 * not decide how a thing is called. A door from a provider nobody enumerated
 * still gets a name, rather than the empty row the old label left behind.
 */
export function accessPointTitle(accessPoint) {
  if (accessPoint?.type === "locker") {
    return `Fahrradbox #${accessPoint.externalBookingId}`;
  }

  return accessPoint?.label || "Unbekannte Tür";
}

/** An unknown mode is named as unknown, never silently left blank. */
export function accessPointMode(accessPoint) {
  return ACCESS_POINT_MODES[accessPoint?.mode] || UNKNOWN_MODE;
}
