/**
 * Invoices, receipts and cancellation receipts of a booking, opened,
 * downloaded and printed in the browser.
 *
 * The backend sends a document as `Content-Disposition: attachment` and the
 * BFF does not hand that header on, so a link to the BFF route cannot show
 * it. The browser fetches the bytes instead and works from a Blob URL.
 */

/** How long a downloaded document's Blob URL stays readable. */
const BLOB_URL_LIFETIME_MS = 60_000;

/**
 * The file name a downloaded document is saved under: its title, else its
 * name, ending in `.pdf`.
 * @param {{ title?: string, name?: string }} attachment
 * @returns {string}
 */
export function paymentDocumentFileName(attachment) {
  const name = attachment.title || attachment.name || "document";
  return /\.pdf$/i.test(name) ? name : `${name}.pdf`;
}

/**
 * Fetches the bytes of a booking's payment document by its type: invoice,
 * receipt, cancellation receipt or withdrawal
 * receipt („Widerrufbeleg“). Throws for a
 * document without its booking or of another type.
 * @param {{
 *   getBookingInvoice: Function,
 *   getBookingReceipt: Function,
 *   getBookingCancellationReceipt: Function,
 *   getBookingWithdrawalReceipt: Function,
 * }} api The booking routes of the BFF, as `useBookings` has them.
 * @param {{ type: string, name: string, tenantId: string, bookingId: string }} paymentDocument
 * @returns {Promise<Blob>}
 */
export async function fetchBookingPaymentDocument(
  api,
  { tenantId, bookingId, type, name },
) {
  if (!tenantId || !bookingId) {
    throw new Error("The document's booking is unknown");
  }
  switch (type) {
    case "invoice":
      return api.getBookingInvoice(tenantId, bookingId, name);
    case "receipt":
      return api.getBookingReceipt(tenantId, bookingId, name);
    case "cancellation":
      return api.getBookingCancellationReceipt(tenantId, bookingId, name);
    case "withdrawal":
      return api.getBookingWithdrawalReceipt(tenantId, bookingId, name);
    default:
      throw new Error(`No payment document: ${type}`);
  }
}

/**
 * Open, download and print for payment documents.
 * @param {object} options
 * @param {Window} options.win The browser window.
 * @param {(attachment: object) => Promise<Blob>} options.fetchDocument
 *   Fetches the document's bytes; throws when it is not available.
 * @param {(error: unknown) => void} options.onError Told when a document
 *   could not be fetched.
 */
export function createPaymentDocumentActions({ win, fetchDocument, onError }) {
  let printFrame = null;

  /** A Blob URL for the document's bytes, typed as PDF so a tab shows it. */
  async function pdfUrlOf(attachment) {
    const bytes = await fetchDocument(attachment);
    if (!bytes) {
      throw new Error("The document is empty");
    }
    const pdf = new Blob([bytes], { type: "application/pdf" });
    return win.URL.createObjectURL(pdf);
  }

  function freeLater(url) {
    win.setTimeout(() => win.URL.revokeObjectURL(url), BLOB_URL_LIFETIME_MS);
  }

  function saveAs(url, fileName) {
    const link = win.document.createElement("a");
    link.href = url;
    link.setAttribute("download", fileName);
    win.document.body.appendChild(link);
    link.click();
    link.remove();
  }

  /**
   * Shows the document in a new tab. The tab stays able to save or reload
   * the PDF, so its Blob URL lives as long as this page.
   */
  async function open(attachment) {
    // The tab opens within the click; one opened after the fetch would be a
    // popup the browser blocks.
    const tab = win.open("", "_blank");
    if (!tab) {
      onError(new Error("The browser blocked the new tab"));
      return;
    }
    try {
      const url = await pdfUrlOf(attachment);
      tab.opener = null;
      tab.location.href = url;
    } catch (error) {
      tab.close();
      onError(error);
    }
  }

  /** Saves the document under its title. */
  async function download(attachment) {
    try {
      const url = await pdfUrlOf(attachment);
      saveAs(url, paymentDocumentFileName(attachment));
      freeLater(url);
    } catch (error) {
      onError(error);
    }
  }

  /**
   * Opens the print dialog for the document, loaded into a hidden frame of
   * this page. A frame that refuses to print reports an error.
   */
  async function print(attachment) {
    let url;
    try {
      url = await pdfUrlOf(attachment);
    } catch (error) {
      onError(error);
      return;
    }

    // The dialog may still read the frame before; it goes with the next print.
    if (printFrame) {
      win.URL.revokeObjectURL(printFrame.url);
      printFrame.frame.remove();
    }
    const frame = win.document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.tabIndex = -1;
    // Off screen but with a size: a frame without one may not load its PDF
    // viewer, and prints blank.
    Object.assign(frame.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "1px",
      height: "1px",
      border: "0",
    });
    frame.addEventListener("load", () => {
      try {
        frame.contentWindow.focus();
        frame.contentWindow.print();
      } catch (error) {
        onError(error);
      }
    });
    frame.setAttribute("src", url);
    win.document.body.appendChild(frame);
    printFrame = { frame, url };
  }

  return { open, download, print };
}
