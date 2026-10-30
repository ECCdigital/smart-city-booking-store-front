/**
 * Whether the checkout asked for acceptance of an attachment of the booking:
 * it asks for a tick at every attachment the bookable shows and requires
 * (`show` and `required`) and does not finish without it, so such an
 * attachment was accepted. The bookable as the booking used it
 * (`_bookableUsed`) tells which ones those were.
 *
 * @param {Object} attachment An attachment of the booking.
 * @param {Object} booking The booking, with its `bookableItems`.
 * @returns {boolean}
 */
export function requiresAcceptance(attachment, booking) {
  const bookableUsed = (booking?.bookableItems || [])
    .map((item) => item?._bookableUsed)
    .find((bookable) => bookable?.id === attachment?.bookableId);

  return (bookableUsed?.attachments || []).some(
    (offered) =>
      offered?.show === true &&
      offered?.required === true &&
      offered.type === attachment.type &&
      offered.title === attachment.title,
  );
}
