import { useBookings } from "~/composables/api/useBookings.js";
import {
  createPaymentDocumentActions,
  fetchBookingPaymentDocument,
} from "~/utils/paymentDocument.js";

/**
 * Open, download and print an invoice, receipt or cancellation receipt of a
 * booking through the BFF. A document that cannot be fetched shows an error.
 * Call the actions from a click only: they need the browser window.
 */
export function usePaymentDocument() {
  const { t } = useI18n();
  const notification = useNotification();
  const bookings = useBookings();

  let actions = null;

  /** Built on first use: the actions need the browser window. */
  function getActions() {
    actions ??= createPaymentDocumentActions({
      win: window,
      fetchDocument: (paymentDocument) =>
        fetchBookingPaymentDocument(bookings, paymentDocument),
      onError: () =>
        notification.error(
          t("booking.document.unavailableMessage"),
          t("booking.document.unavailableTitle"),
        ),
    });
    return actions;
  }

  /**
   * The document with the booking it belongs to, as the actions take it.
   * @param {{ type: string, name: string, title?: string }} attachment
   * @param {{ tenantId: string, bookingId: string }} owner
   */
  const documentOf = (attachment, { tenantId, bookingId }) => ({
    ...attachment,
    tenantId,
    bookingId,
  });

  return {
    openDocument: (attachment, owner) =>
      getActions().open(documentOf(attachment, owner)),
    downloadDocument: (attachment, owner) =>
      getActions().download(documentOf(attachment, owner)),
    printDocument: (attachment, owner) =>
      getActions().print(documentOf(attachment, owner)),
  };
}
