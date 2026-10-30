import { JSDOM } from "jsdom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createPaymentDocumentActions,
  fetchBookingPaymentDocument,
  paymentDocumentFileName,
} from "~/utils/paymentDocument.js";

// Invoices and receipts open, download and print from the table under
// Konto › Rechnungen (ECCdigital/tickets#458). The backend sends them as
// `attachment` and the BFF drops that header, so the browser gets the bytes
// and works from a Blob URL.

const invoice = {
  type: "invoice",
  name: "R-2026-0001.pdf",
  title: "Rechnung R-2026-0001",
};

/** A browser window with the parts the actions reach for, observable. */
function browserWindow() {
  const { window } = new JSDOM("<!doctype html><body></body>");
  let next = 0;
  window.URL.createObjectURL = vi.fn(() => `blob:pdf-${++next}`);
  window.URL.revokeObjectURL = vi.fn();
  window.setTimeout = vi.fn();
  window.HTMLAnchorElement.prototype.click = vi.fn();
  const tab = { location: { href: "" }, close: vi.fn(), opener: window };
  window.open = vi.fn(() => tab);
  return { window, tab };
}

function pdfBytes() {
  // The BFF may hand the bytes on without a type; a tab only shows a PDF
  // whose Blob says it is one.
  return new Blob(["%PDF-1.7"]);
}

describe("paymentDocumentFileName", () => {
  it("names the file after the title, as a PDF", () => {
    expect(paymentDocumentFileName(invoice)).toBe("Rechnung R-2026-0001.pdf");
  });

  it("keeps a title that already ends in .pdf", () => {
    expect(paymentDocumentFileName({ ...invoice, title: "R-1.PDF" })).toBe(
      "R-1.PDF",
    );
  });

  it("falls back to the name without a title", () => {
    expect(paymentDocumentFileName({ ...invoice, title: "" })).toBe(
      "R-2026-0001.pdf",
    );
  });
});

describe("fetchBookingPaymentDocument", () => {
  const owner = { tenantId: "t1", bookingId: "b1" };

  function bookingRoutes() {
    return {
      getBookingInvoice: vi.fn(async () => "invoice-bytes"),
      getBookingReceipt: vi.fn(async () => "receipt-bytes"),
      getBookingCancellationReceipt: vi.fn(async () => "cancellation-bytes"),
      getBookingWithdrawalReceipt: vi.fn(async () => "withdrawal-bytes"),
    };
  }

  it.each([
    ["invoice", "getBookingInvoice", "invoice-bytes"],
    ["receipt", "getBookingReceipt", "receipt-bytes"],
    // The cancellation receipt of the booking details (ECCdigital/tickets#291).
    ["cancellation", "getBookingCancellationReceipt", "cancellation-bytes"],
    // The withdrawal receipt of an accepted withdrawal („Widerrufbeleg“).
    ["withdrawal", "getBookingWithdrawalReceipt", "withdrawal-bytes"],
  ])("fetches a %s through %s", async (type, route, bytes) => {
    const api = bookingRoutes();

    await expect(
      fetchBookingPaymentDocument(api, { ...owner, type, name: "D-1.pdf" }),
    ).resolves.toBe(bytes);

    expect(api[route]).toHaveBeenCalledWith("t1", "b1", "D-1.pdf");
  });

  it("refuses an attachment that is no payment document", async () => {
    const api = bookingRoutes();

    await expect(
      fetchBookingPaymentDocument(api, { ...owner, type: "agreement" }),
    ).rejects.toThrow("No payment document: agreement");
  });

  it("refuses a document without its booking", async () => {
    await expect(
      fetchBookingPaymentDocument(bookingRoutes(), {
        type: "cancellation",
        name: "S-1.pdf",
      }),
    ).rejects.toThrow("The document's booking is unknown");
  });

  it("lets the actions download a cancellation receipt", async () => {
    const { window: win } = browserWindow();
    const api = bookingRoutes();
    const onError = vi.fn();
    const { download } = createPaymentDocumentActions({
      win,
      fetchDocument: (paymentDocument) =>
        fetchBookingPaymentDocument(api, paymentDocument),
      onError,
    });

    await download({
      ...owner,
      type: "cancellation",
      name: "S-2026-0001.pdf",
      title: "Stornobeleg S-2026-0001",
    });

    expect(onError).not.toHaveBeenCalled();
    const link = win.HTMLAnchorElement.prototype.click.mock.contexts[0];
    expect(link.getAttribute("download")).toBe("Stornobeleg S-2026-0001.pdf");
  });
});

describe("createPaymentDocumentActions", () => {
  let win;
  let tab;
  let onError;

  beforeEach(() => {
    ({ window: win, tab } = browserWindow());
    onError = vi.fn();
  });

  function actions(fetchDocument) {
    return createPaymentDocumentActions({ win, fetchDocument, onError });
  }

  describe("open", () => {
    it("opens the tab on the click and shows the PDF in it", async () => {
      let blobType;
      win.URL.createObjectURL = vi.fn((blob) => {
        blobType = blob.type;
        return "blob:pdf-1";
      });
      const fetchDocument = vi.fn(async () => {
        // A tab opened after the fetch would be a popup the browser blocks.
        expect(win.open).toHaveBeenCalledWith("", "_blank");
        return pdfBytes();
      });

      await actions(fetchDocument).open(invoice);

      expect(fetchDocument).toHaveBeenCalledWith(invoice);
      expect(blobType).toBe("application/pdf");
      expect(tab.location.href).toBe("blob:pdf-1");
      expect(tab.opener).toBeNull();
      // The tab may still save or reload the PDF.
      expect(win.URL.revokeObjectURL).not.toHaveBeenCalled();
      expect(win.setTimeout).not.toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("closes the empty tab and reports a document it cannot fetch", async () => {
      const failure = new Error("404");

      await actions(async () => {
        throw failure;
      }).open(invoice);

      expect(tab.close).toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("reports a tab the browser refused, without fetching", async () => {
      win.open = vi.fn(() => null);
      const fetchDocument = vi.fn(async () => pdfBytes());

      await actions(fetchDocument).open(invoice);

      expect(fetchDocument).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalled();
    });
  });

  describe("download", () => {
    it("saves the PDF under its title", async () => {
      await actions(async () => pdfBytes()).download(invoice);

      const click = win.HTMLAnchorElement.prototype.click;
      expect(click).toHaveBeenCalledTimes(1);
      const link = click.mock.contexts[0];
      expect(link.href).toBe("blob:pdf-1");
      expect(link.getAttribute("download")).toBe("Rechnung R-2026-0001.pdf");
      expect(win.document.querySelector("a")).toBeNull();
      expect(win.open).not.toHaveBeenCalled();
    });

    it("reports a document it cannot fetch", async () => {
      const failure = new Error("500");

      await actions(async () => {
        throw failure;
      }).download(invoice);

      expect(win.HTMLAnchorElement.prototype.click).not.toHaveBeenCalled();
      expect(onError).toHaveBeenCalledWith(failure);
    });
  });

  describe("print", () => {
    it("loads the PDF into a hidden frame and opens the print dialog", async () => {
      await actions(async () => pdfBytes()).print(invoice);

      const frame = win.document.querySelector("iframe");
      expect(frame.getAttribute("src")).toBe("blob:pdf-1");
      expect(frame.style.position).toBe("fixed");
      expect(frame.style.width).toBe("1px");
      const print = vi.fn();
      const focus = vi.fn();
      Object.defineProperty(frame, "contentWindow", {
        value: { print, focus },
      });

      frame.dispatchEvent(new win.Event("load"));

      expect(print).toHaveBeenCalled();
      expect(onError).not.toHaveBeenCalled();
    });

    it("keeps one print frame and frees the PDF of the one before", async () => {
      const { print } = actions(async () => pdfBytes());

      await print(invoice);
      await print(invoice);

      const frames = win.document.querySelectorAll("iframe");
      expect(frames).toHaveLength(1);
      expect(frames[0].getAttribute("src")).toBe("blob:pdf-2");
      expect(win.URL.revokeObjectURL).toHaveBeenCalledWith("blob:pdf-1");
    });

    it("reports a frame that cannot print", async () => {
      await actions(async () => pdfBytes()).print(invoice);

      const frame = win.document.querySelector("iframe");
      const failure = new Error("cross-origin");
      Object.defineProperty(frame, "contentWindow", {
        value: {
          focus: () => {},
          print: () => {
            throw failure;
          },
        },
      });
      frame.dispatchEvent(new win.Event("load"));

      expect(onError).toHaveBeenCalledWith(failure);
    });

    it("reports a document it cannot fetch", async () => {
      const failure = new Error("404");

      await actions(async () => {
        throw failure;
      }).print(invoice);

      expect(win.document.querySelector("iframe")).toBeNull();
      expect(onError).toHaveBeenCalledWith(failure);
    });
  });

  it("frees a downloaded PDF once the browser had time to save it", async () => {
    await actions(async () => pdfBytes()).download(invoice);

    const [free] = win.setTimeout.mock.calls.at(-1);
    free();
    expect(win.URL.revokeObjectURL).toHaveBeenCalledWith("blob:pdf-1");
  });
});
