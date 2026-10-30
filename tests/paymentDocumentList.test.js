import { describe, expect, it } from "vitest";

import {
  paymentDocumentsOf,
  searchPaymentDocuments,
} from "~/utils/paymentDocumentList.js";

const booking = (overrides = {}) => ({
  id: "ABCD-1234",
  bookableItems: [{ _bookableUsed: { title: "Großer Saal" } }],
  attachments: [
    { type: "invoice", title: "Rechnung 1", timeCreated: "1700000000000" },
  ],
  ...overrides,
});

const bookings = [
  booking(),
  booking({
    id: "WXYZ-9876",
    bookableItems: [
      { _bookableUsed: { title: "Nähmaschine" } },
      { _bookableUsed: { title: "Lasercutter" } },
    ],
    attachments: [
      { type: "receipt", name: "beleg.pdf", timeCreated: 1700000500000 },
      { type: "contract", title: "Vertrag" },
      { type: "cancellation", name: "storno.pdf", timeCreated: 1700000900000 },
    ],
  }),
  booking({ id: "NOBOOKABLE-1", bookableItems: [] }),
];

describe("the withdrawal receipt in the invoice list", () => {
  it("is listed beside invoices, receipts and cancellation receipts", () => {
    const withdrawn = booking({
      id: "WD-1",
      attachments: [
        { type: "invoice", title: "Rechnung 1", timeCreated: 1 },
        { type: "cancellation", title: "Stornorechnung", timeCreated: 2 },
        { type: "withdrawal", title: "Widerrufbeleg", timeCreated: 3 },
      ],
    });

    expect(paymentDocumentsOf([withdrawn]).map((d) => d.type)).toEqual([
      "invoice",
      "cancellation",
      "withdrawal",
    ]);
  });
});

describe("the payment documents of the invoice list", () => {
  it("takes the invoices, receipts and cancellation receipts of every booking, nothing else", () => {
    expect(
      paymentDocumentsOf(bookings).map((d) => [d.bookingId, d.type]),
    ).toEqual([
      ["ABCD-1234", "invoice"],
      ["WXYZ-9876", "receipt"],
      ["WXYZ-9876", "cancellation"],
      ["NOBOOKABLE-1", "invoice"],
    ]);
  });

  it("names a document by its title or file and its booking's bookables", () => {
    const [invoice, receipt, , bare] = paymentDocumentsOf(bookings);
    expect(invoice).toMatchObject({
      key: "ABCD-1234/1700000000000/Rechnung 1",
      title: "Rechnung 1",
      timeCreated: 1700000000000,
      bookableNames: "Großer Saal",
    });
    expect(receipt).toMatchObject({
      title: "beleg.pdf",
      bookableNames: "Nähmaschine, Lasercutter",
    });
    expect(bare.bookableNames).toBe("");
  });

  it("carries what fetching the document needs: its attachment and tenant", () => {
    const withTenant = booking({ tenantId: "rp43" });
    const [invoice] = paymentDocumentsOf([withTenant]);
    expect(invoice.tenantId).toBe("rp43");
    expect(invoice.attachment).toBe(withTenant.attachments[0]);
  });

  it("keeps nothing for a booking without attachments or no bookings", () => {
    expect(paymentDocumentsOf([booking({ attachments: undefined })])).toEqual(
      [],
    );
    expect(paymentDocumentsOf(undefined)).toEqual([]);
  });
});

describe("the search of the invoice list", () => {
  const documents = paymentDocumentsOf(bookings);
  const ids = (list) => list.map((d) => d.bookingId);

  it("finds a document by a bookable of its booking, case and accents aside", () => {
    expect(ids(searchPaymentDocuments(documents, "SAAL"))).toEqual([
      "ABCD-1234",
    ]);
    expect(ids(searchPaymentDocuments(documents, "nahmasch"))).toEqual([
      "WXYZ-9876",
      "WXYZ-9876",
    ]);
    expect(ids(searchPaymentDocuments(documents, "laser"))).toEqual([
      "WXYZ-9876",
      "WXYZ-9876",
    ]);
  });

  it("does not search the title or the booking id", () => {
    expect(searchPaymentDocuments(documents, "rechnung")).toEqual([]);
    expect(searchPaymentDocuments(documents, "abcd")).toEqual([]);
  });

  it("narrows to the chosen type, together with the search", () => {
    expect(
      searchPaymentDocuments(documents, "", "cancellation").map((d) => d.type),
    ).toEqual(["cancellation"]);
    expect(ids(searchPaymentDocuments(documents, "", "invoice"))).toEqual([
      "ABCD-1234",
      "NOBOOKABLE-1",
    ]);
    expect(searchPaymentDocuments(documents, "saal", "receipt")).toEqual([]);
  });

  it("keeps everything for an empty query, a document without bookable included", () => {
    expect(searchPaymentDocuments(documents, "")).toHaveLength(4);
    expect(searchPaymentDocuments(documents, undefined)).toHaveLength(4);
  });
});
