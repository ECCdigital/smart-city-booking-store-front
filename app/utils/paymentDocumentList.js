/**
 * The framework-free part of the invoice list in the account area: which
 * attachments of the user's bookings are payment documents and how they are
 * searched. A booking carries its attachments and the bookables it used.
 */

import { includesText } from "./textSearch.js";

const PAYMENT_TYPES = ["invoice", "receipt"];

/**
 * The invoices and receipts of the bookings, each named by its title (or file
 * name) and by the titles of its booking's bookables, joined; empty when the
 * booking names none. `key` tells one document from the others.
 */
export function paymentDocumentsOf(bookings) {
  return (bookings ?? []).flatMap((booking) => {
    const bookableNames = (booking.bookableItems || [])
      .map((item) => item._bookableUsed?.title)
      .filter(Boolean)
      .join(", ");

    return (booking.attachments || [])
      .filter((attachment) => PAYMENT_TYPES.includes(attachment.type))
      .map((attachment) => {
        const timeCreated = Number(attachment.timeCreated) || 0;
        const title = attachment.title || attachment.name || "";
        return {
          key: `${booking.id}/${timeCreated}/${title}`,
          timeCreated,
          title,
          type: attachment.type,
          bookingId: booking.id,
          bookableNames,
          booking,
        };
      });
  });
}

/**
 * The documents whose bookables hold the searched text, case and accents
 * aside. An empty query keeps everything.
 */
export function searchPaymentDocuments(documents, query) {
  return (documents ?? []).filter((document) =>
    includesText(document.bookableNames, query),
  );
}
