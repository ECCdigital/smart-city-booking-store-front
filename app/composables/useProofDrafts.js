/**
 * The proofs chosen on the page „Nachweise einreichen“ but not handed in
 * yet: per booking, each file with its upload field
 * and, for a replacement, the upload it takes the place of. The button
 * „Nachweise einreichen“ of a booking hands them in at once. They live in
 * the page only: leaving it, or the browser tab, asks first. A file the
 * backend refused stays at its field with the reason until it is taken off;
 * it is not sent again and does not count as waiting.
 */

import { onBeforeUnmount, onMounted, reactive } from "vue";

export const PROOF_DRAFTS_KEY = Symbol("proofDrafts");

let nextDraftId = 0;

/**
 * The drafts of one page. Provided to the upload fields under
 * {@link PROOF_DRAFTS_KEY}.
 */
export function createProofDrafts() {
  const byBooking = reactive({});

  const of = (bookingId) => byBooking[bookingId] ?? [];
  const waiting = (bookingId) => of(bookingId).filter((d) => !d.refusal);

  return {
    /** The drafts of a booking, refused ones included. */
    of,
    /** The drafts of a booking still to hand in. */
    waiting,
    /** The drafts of an upload field of a booking. */
    ofField: (bookingId, fieldId) =>
      of(bookingId).filter((draft) => draft.fieldId === fieldId),
    /** The draft that replaces an upload, if any. */
    replacementOf: (bookingId, mediaId) =>
      of(bookingId).find((draft) => draft.replacing === mediaId) ?? null,
    /**
     * Notes a chosen file; a second replacement of the same upload takes
     * the place of the first.
     */
    add(bookingId, { fieldId, replacing = null, file, alsoFor = [] }) {
      const kept = of(bookingId).filter(
        (draft) => !replacing || draft.replacing !== replacing,
      );
      byBooking[bookingId] = [
        ...kept,
        {
          id: ++nextDraftId,
          fieldId,
          replacing,
          file,
          // The fields of other bookings of the series it counts for too;
          // none for a replacement.
          alsoFor: replacing ? [] : alsoFor,
          refusal: null,
        },
      ];
    },
    /** The other bookings of the series a chosen file counts for. */
    setAlsoFor(bookingId, draftId, alsoFor) {
      byBooking[bookingId] = of(bookingId).map((draft) =>
        draft.id === draftId ? { ...draft, alsoFor } : draft,
      );
    },
    /** Takes a chosen file off again. */
    remove(bookingId, draftId) {
      byBooking[bookingId] = of(bookingId).filter(
        (draft) => draft.id !== draftId,
      );
    },
    /** Forgets the replacement of an upload, e.g. once it is deleted. */
    dropReplacementOf(bookingId, mediaId) {
      byBooking[bookingId] = of(bookingId).filter(
        (draft) => draft.replacing !== mediaId,
      );
    },
    /**
     * After „Nachweise einreichen“: forgets the drafts stored and keeps the
     * refused ones with their refusal.
     *
     * @param {string} bookingId
     * @param {{storedIds: number[], refusals: Array<{id: number, refusal: Object}>}} outcome
     */
    settle(bookingId, { storedIds = [], refusals = [] }) {
      const stored = new Set(storedIds);
      const refusalOf = new Map(refusals.map((r) => [r.id, r.refusal]));
      byBooking[bookingId] = of(bookingId)
        .filter((draft) => !stored.has(draft.id))
        .map((draft) =>
          refusalOf.has(draft.id)
            ? { ...draft, refusal: refusalOf.get(draft.id) }
            : draft,
        );
    },
    /** Forgets every draft of a booking. */
    clear(bookingId) {
      delete byBooking[bookingId];
    },
    /** How many files of all bookings wait to be handed in. */
    count: () =>
      Object.keys(byBooking).reduce(
        (sum, bookingId) => sum + waiting(bookingId).length,
        0,
      ),
  };
}

/**
 * Warns before a page with drafts is left: within the storefront with a
 * question, which keeps the page unless the customer confirms; the tab
 * closed or reloaded with the browser's own question.
 *
 * @param {ReturnType<typeof createProofDrafts>} drafts
 */
export function useUnsavedProofsGuard(drafts) {
  const { t } = useI18n();

  onBeforeRouteLeave(() => {
    if (drafts.count() === 0) return true;
    return window.confirm(t("customerUploads.unsavedLeave"));
  });

  if (import.meta.client) {
    const onBeforeUnload = (event) => {
      if (drafts.count() === 0) return;
      event.preventDefault();
      // Older browsers ask only with a return value.
      event.returnValue = "";
    };
    onMounted(() => window.addEventListener("beforeunload", onBeforeUnload));
    onBeforeUnmount(() =>
      window.removeEventListener("beforeunload", onBeforeUnload),
    );
  }
}
