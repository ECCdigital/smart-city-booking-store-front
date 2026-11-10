import { describe, expect, it } from "vitest";

import { createProofDrafts } from "~/composables/useProofDrafts.js";
import {
  fieldWithDrafts,
  seriesTargetOptionsOf,
  submissionAlsoForOf,
  submissionFormOf,
  submissionOrderOf,
  submissionOutcomeOf,
  submissionPartName,
} from "~/utils/customerUploads.js";

/**
 * The proofs chosen on the page „Nachweise einreichen“ before the button
 * „Nachweise einreichen“ hands them in at once:
 * noted per booking, counted against the field, sent as one multipart body.
 */

const file = (name) =>
  new File(["%PDF-1.4"], name, { type: "application/pdf" });

describe("createProofDrafts", () => {
  it("notes chosen files per booking and field, and forgets them once handed in", () => {
    const drafts = createProofDrafts();

    drafts.add("B-1", { fieldId: "club-card", file: file("vorne.pdf") });
    drafts.add("B-1", { fieldId: "statute", file: file("satzung.pdf") });
    drafts.add("B-2", { fieldId: "club-card", file: file("ausweis.pdf") });

    expect(drafts.count()).toBe(3);
    expect(drafts.ofField("B-1", "club-card").map((d) => d.file.name)).toEqual([
      "vorne.pdf",
    ]);

    drafts.clear("B-1");

    expect(drafts.of("B-1")).toEqual([]);
    expect(drafts.count()).toBe(1);
  });

  it("keeps one replacement per upload, and drops it with the upload", () => {
    const drafts = createProofDrafts();

    drafts.add("B-1", {
      fieldId: "club-card",
      replacing: "M-1",
      file: file("erster.pdf"),
    });
    drafts.add("B-1", {
      fieldId: "club-card",
      replacing: "M-1",
      file: file("zweiter.pdf"),
    });

    expect(drafts.replacementOf("B-1", "M-1").file.name).toBe("zweiter.pdf");
    expect(drafts.count()).toBe(1);

    drafts.dropReplacementOf("B-1", "M-1");
    expect(drafts.count()).toBe(0);
  });

  it("takes one chosen file off again", () => {
    const drafts = createProofDrafts();
    drafts.add("B-1", { fieldId: "club-card", file: file("a.pdf") });
    drafts.add("B-1", { fieldId: "club-card", file: file("b.pdf") });

    drafts.remove("B-1", drafts.of("B-1")[0].id);

    expect(drafts.of("B-1").map((d) => d.file.name)).toEqual(["b.pdf"]);
  });
});

describe("a file refused on its own (ECCdigital/tickets#830)", () => {
  it("stays at its field with the reason, is not sent again and does not count as waiting", () => {
    const drafts = createProofDrafts();
    drafts.add("B-1", { fieldId: "club-card", file: file("ausweis.pdf") });
    drafts.add("B-1", { fieldId: "statute", file: file("satzung.pdf") });
    const sent = submissionOrderOf(drafts.waiting("B-1"));

    drafts.settle(
      "B-1",
      submissionOutcomeOf(sent, [
        { index: 1, code: "customer_upload_virus_found", params: {} },
      ]),
    );

    expect(drafts.of("B-1").map((d) => [d.file.name, d.refusal?.code])).toEqual(
      [["satzung.pdf", "customer_upload_virus_found"]],
    );
    expect(drafts.waiting("B-1")).toEqual([]);
    expect(drafts.count()).toBe(0);
  });

  it("is named by its position in the order the backend reads the files", () => {
    const drafts = [
      { id: 1, fieldId: "club-card" },
      { id: 2, fieldId: "statute" },
      { id: 3, fieldId: "club-card" },
    ];

    const sent = submissionOrderOf(drafts);

    expect(sent.map((d) => d.id)).toEqual([1, 3, 2]);
    expect(
      submissionOutcomeOf(sent, [
        { index: 1, code: "customer_upload_field_full" },
      ]),
    ).toEqual({
      storedIds: [1, 2],
      refusals: [
        { id: 3, refusal: { code: "customer_upload_field_full", params: {} } },
      ],
    });
  });
});

describe("the body of „Nachweise einreichen“", () => {
  it("names each file by its field, a replacement by the upload too", () => {
    expect(submissionPartName({ fieldId: "club-card" })).toBe(
      "customerUpload:club-card",
    );
    expect(submissionPartName({ fieldId: "club-card", replacing: "M-1" })).toBe(
      "customerUpload:club-card:M-1",
    );

    const form = submissionFormOf([
      { fieldId: "club-card", file: file("vorne.pdf") },
      { fieldId: "club-card", replacing: "M-1", file: file("neu.pdf") },
    ]);
    expect([...form.keys()]).toEqual([
      "customerUpload:club-card",
      "customerUpload:club-card:M-1",
    ]);
    expect(form.get("customerUpload:club-card").name).toBe("vorne.pdf");
  });

  it("counts new files against the places of the field, a replacement not", () => {
    const field = { fieldId: "club-card", remainingFiles: 2 };

    expect(
      fieldWithDrafts(field, [
        { fieldId: "club-card" },
        { fieldId: "club-card", replacing: "M-1" },
        { fieldId: "statute" },
      ]).remainingFiles,
    ).toBe(1);
    expect(fieldWithDrafts(field, [])).toBe(field);
    expect(
      fieldWithDrafts(field, [
        { fieldId: "club-card" },
        { fieldId: "club-card" },
        { fieldId: "club-card" },
      ]).remainingFiles,
    ).toBe(0);
  });
});

/**
 * A file of a series for other dates too: the
 * draft notes the fields of the other bookings, the form names them by the
 * file's position.
 */
describe("proofs for several dates of a series", () => {
  const field = (fieldId, overrides = {}) => ({
    fieldId,
    label: fieldId === "card" ? "Ausweis" : "Sozialpass",
    state: "open",
    remainingFiles: 1,
    ...overrides,
  });
  const booking = (id, timeBegin, fields, groupIds = ["B1", "B2", "B3"]) => ({
    id,
    timeBegin,
    timeEnd: timeBegin + 3600_000,
    customerUploadState: {
      fields,
      group: groupIds ? { id: "G-1", bookingIds: groupIds } : null,
    },
  });

  it("offers the fields of the other dates with room, the same field preset", () => {
    const own = booking("B1", 1000, [field("card")]);
    const bookings = [
      booking("B3", 3000, [field("card"), field("social")]),
      own,
      booking("B2", 2000, [field("card", { state: "fulfilled" })]),
      booking("X", 500, [field("card")]),
    ];

    expect(seriesTargetOptionsOf(own, bookings, "card")).toEqual([
      {
        bookingId: "B3",
        fieldId: "card",
        fieldLabel: "Ausweis",
        timeBegin: 3000,
        timeEnd: 3000 + 3600_000,
        preset: true,
      },
      {
        bookingId: "B3",
        fieldId: "social",
        fieldLabel: "Sozialpass",
        timeBegin: 3000,
        timeEnd: 3000 + 3600_000,
        preset: false,
      },
    ]);
  });

  it("offers nothing outside a series", () => {
    const own = booking("B1", 1000, [field("card")], null);
    expect(seriesTargetOptionsOf(own, [own], "card")).toEqual([]);
  });

  it("notes the other dates at a draft, none for a replacement", () => {
    const drafts = createProofDrafts();
    const target = { bookingId: "B2", fieldId: "card" };
    drafts.add("B1", { fieldId: "card", file: file("a.pdf"), alsoFor: [target] });
    drafts.add("B1", {
      fieldId: "card",
      replacing: "M1",
      file: file("b.pdf"),
      alsoFor: [target],
    });
    const [first, second] = drafts.of("B1");
    expect(first.alsoFor).toEqual([target]);
    expect(second.alsoFor).toEqual([]);

    drafts.setAlsoFor("B1", first.id, []);
    expect(drafts.of("B1")[0].alsoFor).toEqual([]);
  });

  it("sends the other dates by the position of each new file", () => {
    const target = { bookingId: "B2", fieldId: "card" };
    const ordered = [
      { fieldId: "card", replacing: null, file: file("a.pdf"), alsoFor: [] },
      {
        fieldId: "card",
        replacing: null,
        file: file("b.pdf"),
        alsoFor: [{ ...target, fieldLabel: "x" }],
      },
      { fieldId: "card", replacing: "M1", file: file("c.pdf"), alsoFor: [target] },
    ];
    expect(submissionAlsoForOf(ordered)).toEqual({ 1: [target] });

    const form = submissionFormOf(ordered);
    expect(JSON.parse(form.get("alsoFor"))).toEqual({ 1: [target] });
    expect(submissionFormOf([ordered[0]]).get("alsoFor")).toBeNull();
  });
});
