import { describe, expect, it } from "vitest";

import {
  mostUrgentProofFieldOf,
  proofAnchorId,
  proofPageLink,
  proofTargetOf,
  acceptOf,
  filterProofGroups,
  customerUploadErrorKey,
  customerUploadErrorOf,
  customerUploadFieldView,
  daysLeft,
  formatOfFile,
  hasPendingProofs,
  pendingProofGroups,
  precheckCustomerUpload,
} from "~/utils/customerUploads.js";

/**
 * Customer uploads as the storefront shows them:
 * the state of each upload field read off the backend's
 * `customerUploadState`, the check before a file is sent, and the page
 * „Nachweise einreichen“ by tenant and booking.
 */

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2027, 5, 1, 12);
const MB = 1024 * 1024;

const field = (overrides = {}) => ({
  fieldId: "f1",
  label: "Vereinsausweis",
  hint: "",
  consentText: "",
  required: true,
  category: "normal",
  maxFiles: 2,
  formats: ["pdf", "jpeg"],
  maxFileSizeMb: 5,
  deadline: NOW + 10 * DAY,
  pastDeadline: false,
  state: "open",
  remainingFiles: 2,
  uploads: [],
  ...overrides,
});

const upload = (status, reviewedAt = null, reason = "") => ({
  mediaId: `m-${status}-${reviewedAt}`,
  originalFileName: "ausweis.pdf",
  size: 1000,
  mimeType: "application/pdf",
  uploadedAt: 1,
  review: { status, reason, reviewedAt },
});

const file = (name, type, size = 1000) => ({ name, type, size });

describe("customerUploadFieldView", () => {
  it("shows an open field neutral, and as a warning from 3 days before its deadline", () => {
    const open = customerUploadFieldView(field(), NOW);
    expect(open).toMatchObject({
      color: "neutral",
      labelKey: "customerUploads.state.open",
      labelParams: { days: 10 },
      canUpload: true,
      canChange: false,
      lateHint: false,
    });

    const soon = customerUploadFieldView(
      field({ deadline: NOW + 3 * DAY }),
      NOW,
    );
    expect(soon.color).toBe("warning");
  });

  it("names an open field without deadline without one", () => {
    expect(
      customerUploadFieldView(field({ deadline: null }), NOW).labelKey,
    ).toBe("customerUploads.state.openWithoutDeadline");
  });

  it("lets a submitted field be changed, and take more files while there is room", () => {
    const submitted = customerUploadFieldView(
      field({
        state: "submitted",
        remainingFiles: 1,
        uploads: [upload("submitted")],
      }),
      NOW,
    );
    expect(submitted).toMatchObject({
      color: "info",
      labelKey: "customerUploads.state.submitted",
      canChange: true,
      canUpload: true,
    });

    const full = customerUploadFieldView(
      field({ state: "submitted", remainingFiles: 0 }),
      NOW,
    );
    expect(full.canUpload).toBe(false);
  });

  it("shows the reason of the latest rejection, and the late hint past the deadline", () => {
    const rejected = customerUploadFieldView(
      field({
        state: "rejected",
        pastDeadline: true,
        uploads: [
          upload("rejected", 1, "unleserlich"),
          upload("rejected", 2, "abgelaufen"),
        ],
      }),
      NOW,
    );
    expect(rejected).toMatchObject({
      color: "error",
      labelKey: "customerUploads.state.rejected",
      reason: "abgelaufen",
      canUpload: true,
      lateHint: true,
    });
  });

  it("names the reason of the open reopen, and „Erneut anfordern“ as such", () => {
    const requested = customerUploadFieldView(
      field({
        state: "rejected",
        reopen: { kind: "requestedAgain", reason: "Rückseite fehlt", at: 3 },
        uploads: [upload("accepted", 1)],
      }),
      NOW,
    );
    expect(requested).toMatchObject({
      color: "error",
      labelKey: "customerUploads.state.requestedAgain",
      reason: "Rückseite fehlt",
      reasonKey: "customerUploads.requestAgainReason",
      canUpload: true,
    });

    const rejected = customerUploadFieldView(
      field({
        state: "rejected",
        reopen: { kind: "rejected", reason: "unleserlich", at: 2 },
        uploads: [upload("rejected", 2, "unleserlich")],
      }),
      NOW,
    );
    expect(rejected).toMatchObject({
      labelKey: "customerUploads.state.rejected",
      reason: "unleserlich",
      reasonKey: "customerUploads.rejectionReason",
    });
  });

  it("keeps an overdue field open for uploads, with the late hint", () => {
    expect(
      customerUploadFieldView(field({ state: "overdue" }), NOW),
    ).toMatchObject({
      color: "error",
      labelKey: "customerUploads.state.overdue",
      canUpload: true,
      lateHint: true,
    });
  });

  it("shows a checked field with the date of its acceptance and takes nothing more", () => {
    const fulfilled = customerUploadFieldView(
      field({ state: "fulfilled", uploads: [upload("accepted", 1234)] }),
      NOW,
    );
    expect(fulfilled).toMatchObject({
      color: "success",
      labelKey: "customerUploads.state.fulfilled",
      labelParams: { reviewedAt: 1234 },
      canUpload: false,
    });
  });
});

describe("precheckCustomerUpload", () => {
  it("lets a file within size, number and formats go", () => {
    expect(
      precheckCustomerUpload(file("a.pdf", "application/pdf"), field()),
    ).toBe(null);
    expect(precheckCustomerUpload(file("a.JPG", ""), field())).toBe(null);
  });

  it("refuses with the backend's codes, in its order", () => {
    expect(
      precheckCustomerUpload(file("a.pdf", "application/pdf", 6 * MB), field()),
    ).toEqual({
      code: "customer_upload_too_large",
      params: { maxFileSizeMb: 5 },
    });
    expect(
      precheckCustomerUpload(
        file("a.png", "image/png", 6 * MB),
        field({ remainingFiles: 0 }),
      ).code,
    ).toBe("customer_upload_too_large");
    expect(
      precheckCustomerUpload(
        file("a.png", "image/png"),
        field({ remainingFiles: 0 }),
      ),
    ).toEqual({ code: "customer_upload_field_full", params: { maxFiles: 2 } });
    expect(precheckCustomerUpload(file("a.png", "image/png"), field())).toEqual(
      {
        code: "customer_upload_format_not_allowed",
        params: { formats: ["pdf", "jpeg"] },
      },
    );
  });

  it("does not count a replacement against the number", () => {
    expect(
      precheckCustomerUpload(
        file("a.pdf", "application/pdf"),
        field({ remainingFiles: 0 }),
        { replacing: true },
      ),
    ).toBe(null);
  });
});

describe("formats", () => {
  it("reads the format of a file by its type, by its extension without one", () => {
    expect(formatOfFile(file("x.bin", "application/pdf"))).toBe("pdf");
    expect(formatOfFile(file("scan.jpeg", ""))).toBe("jpeg");
    expect(formatOfFile(file("scan.png", "image/png"))).toBe("png");
    expect(formatOfFile(file("scan.gif", "image/gif"))).toBe(null);
  });

  it("builds the accept attribute of the file input", () => {
    expect(acceptOf(["pdf", "png"])).toBe(
      "application/pdf,.pdf,image/png,.png",
    );
  });

  it("counts whole days left, never below 0", () => {
    expect(daysLeft(NOW + 1.5 * DAY, NOW)).toBe(2);
    expect(daysLeft(NOW - DAY, NOW)).toBe(0);
    expect(daysLeft(null, NOW)).toBe(null);
  });
});

describe("pendingProofGroups", () => {
  const booking = (id, tenant, timeBegin, fields) => ({
    id,
    tenantId: tenant.id,
    tenant,
    timeBegin,
    customerUploadState: { state: "missing", fields },
  });
  const stadt = { id: "stadt", name: "Stadt Bad Belzig" };
  const verein = { id: "verein", name: "Sportverein" };

  it("groups by tenant and sorts equally urgent bookings by their start", () => {
    const groups = pendingProofGroups([
      booking("B2", stadt, 300, [field()]),
      booking("B1", verein, 100, [field()]),
      booking("B3", stadt, 200, [field()]),
    ]);

    expect(groups.map((g) => g.tenant.name)).toEqual([
      "Sportverein",
      "Stadt Bad Belzig",
    ]);
    expect(groups[1].bookings.map((e) => e.booking.id)).toEqual(["B3", "B2"]);
  });

  it("sorts by urgency: rejected, overdue, open, submitted", () => {
    const groups = pendingProofGroups([
      booking("submitted", stadt, 100, [field({ state: "submitted" })]),
      booking("open", stadt, 200, [field()]),
      booking("overdue", stadt, 300, [
        field({ state: "overdue", pastDeadline: true }),
      ]),
      booking("rejected", stadt, 400, [
        field({ fieldId: "a", state: "submitted" }),
        field({ fieldId: "b", state: "rejected" }),
      ]),
    ]);

    expect(groups[0].bookings.map((e) => e.booking.id)).toEqual([
      "rejected",
      "overdue",
      "open",
      "submitted",
    ]);
  });

  it("puts the earlier deadline first among equally urgent bookings, then the start", () => {
    const groups = pendingProofGroups([
      booking("later", stadt, 100, [field({ deadline: NOW + 9 * DAY })]),
      booking("sooner", stadt, 500, [field({ deadline: NOW + 2 * DAY })]),
      booking("noDeadline", stadt, 50, [field({ deadline: null })]),
      booking("noDeadlineEarlier", stadt, 10, [field({ deadline: null })]),
    ]);

    expect(groups[0].bookings.map((e) => e.booking.id)).toEqual([
      "sooner",
      "later",
      "noDeadlineEarlier",
      "noDeadline",
    ]);
  });

  it("puts a tenant where its most urgent booking stands", () => {
    const groups = pendingProofGroups([
      booking("V1", verein, 100, [field({ state: "submitted" })]),
      booking("S1", stadt, 200, [field({ state: "rejected" })]),
    ]);
    expect(groups.map((g) => g.tenant.id)).toEqual(["stadt", "verein"]);
  });

  it("marks a booking complete once every field is handed in", () => {
    const [group] = pendingProofGroups([
      booking("all", stadt, 100, [
        field({ fieldId: "a", state: "submitted" }),
        field({ fieldId: "b", state: "submitted" }),
        field({ fieldId: "c", state: "fulfilled" }),
      ]),
      booking("some", stadt, 200, [
        field({ fieldId: "a", state: "submitted" }),
        field({ fieldId: "b" }),
      ]),
    ]);

    expect(
      Object.fromEntries(group.bookings.map((e) => [e.booking.id, e.complete])),
    ).toEqual({ all: true, some: false });
  });

  it("leaves checked fields and bookings without anything open out", () => {
    const groups = pendingProofGroups([
      booking("B1", stadt, 100, [
        field({ fieldId: "done", state: "fulfilled" }),
        field({ fieldId: "open" }),
      ]),
      booking("B2", stadt, 200, [field({ state: "fulfilled" })]),
      { id: "B3", tenantId: "stadt", timeBegin: 300 },
    ]);

    expect(groups).toHaveLength(1);
    expect(groups[0].bookings).toHaveLength(1);
    expect(groups[0].bookings[0].fields.map((f) => f.fieldId)).toEqual([
      "open",
    ]);
  });

  it("tells whether a booking has something for the page", () => {
    expect(hasPendingProofs(booking("B", stadt, 1, [field()]))).toBe(true);
    expect(
      hasPendingProofs(booking("B", stadt, 1, [field({ state: "fulfilled" })])),
    ).toBe(false);
    expect(hasPendingProofs({ id: "B" })).toBe(false);
  });
});

describe("refusals", () => {
  it("maps every code of the backend to a message, the rest to a generic one", () => {
    expect(customerUploadErrorKey("customer_upload_virus_found")).toBe(
      "customerUploads.errors.virus",
    );
    expect(customerUploadErrorKey("customer_upload_scanner_unavailable")).toBe(
      "customerUploads.errors.scanner",
    );
    expect(customerUploadErrorKey("something_else")).toBe(
      "customerUploads.errors.generic",
    );
    expect(customerUploadErrorKey(undefined)).toBe(
      "customerUploads.errors.generic",
    );
  });

  it("reads the code off the error of the API client", () => {
    // `error.data` is the Nitro error; the backend's body is its `data`.
    expect(
      customerUploadErrorOf({
        statusCode: 400,
        data: {
          error: true,
          statusCode: 400,
          data: {
            code: "customer_upload_too_large",
            params: { maxFileSizeMb: 1 },
          },
        },
      }),
    ).toEqual({
      code: "customer_upload_too_large",
      params: { maxFileSizeMb: 1 },
    });
    expect(customerUploadErrorOf({ statusCode: 429, data: {} }).code).toBe(
      "customer_upload_rate_limited",
    );
  });
});

describe("filterProofGroups", () => {
  const stadt = { id: "stadt", name: "Stadt Bad Belzig" };
  const verein = { id: "verein", name: "Sportverein" };
  const booking = (id, tenant, title, fields) => ({
    id,
    tenantId: tenant.id,
    tenant,
    timeBegin: 1,
    bookableItems: [{ _bookableUsed: { title } }],
    customerUploadState: { fields },
  });
  const groups = pendingProofGroups([
    booking("AAAA-1111", stadt, "Turnhalle", [
      field({ fieldId: "open", label: "Vereinsausweis", state: "open" }),
      field({
        fieldId: "late",
        label: "Satzung",
        state: "overdue",
        pastDeadline: true,
      }),
    ]),
    booking("BBBB-2222", verein, "Sportplatz", [
      field({ fieldId: "sub", label: "Ausweis", state: "submitted" }),
      field({
        fieldId: "rej",
        label: "Attest",
        state: "rejected",
        category: "sensitive",
      }),
      field({
        fieldId: "rejLate",
        label: "Liste",
        state: "rejected",
        pastDeadline: true,
      }),
    ]),
  ]);
  const ids = (result) =>
    result.flatMap((g) =>
      g.bookings.flatMap((e) => e.fields.map((f) => f.fieldId)),
    );

  it("shows everything without search and filters", () => {
    expect(ids(filterProofGroups(groups))).toEqual([
      // The booking with a rejected proof first.
      "sub",
      "rej",
      "rejLate",
      "open",
      "late",
    ]);
  });

  it("filters by provider", () => {
    expect(ids(filterProofGroups(groups, { tenantIds: ["verein"] }))).toEqual([
      "sub",
      "rej",
      "rejLate",
    ]);
  });

  it("filters by any of the chosen status options", () => {
    const by = (...statuses) => ids(filterProofGroups(groups, { statuses }));
    expect(by("open")).toEqual(["open"]);
    expect(by("overdue")).toEqual(["rejLate", "late"]);
    expect(by("outstanding")).toEqual(["rej", "open"]);
    expect(by("submitted")).toEqual(["sub"]);
    expect(by("rejected")).toEqual(["rej", "rejLate"]);
    expect(by("open", "submitted")).toEqual(["sub", "open"]);
  });

  it("filters by „besonders schutzwürdig“", () => {
    expect(ids(filterProofGroups(groups, { sensitiveOnly: true }))).toEqual([
      "rej",
    ]);
  });

  it("finds a booking by number, title or provider, a field by its label", () => {
    const find = (query) => ids(filterProofGroups(groups, { query }));
    expect(find("bbbb")).toEqual(["sub", "rej", "rejLate"]);
    expect(find("turnhalle")).toEqual(["open", "late"]);
    expect(find("sportverein")).toEqual(["sub", "rej", "rejLate"]);
    expect(find("attest")).toEqual(["rej"]);
    expect(find("nichts")).toEqual([]);
  });

  it("drops bookings and providers with nothing left", () => {
    const result = filterProofGroups(groups, { statuses: ["submitted"] });
    expect(result).toHaveLength(1);
    expect(result[0].tenant.id).toBe("verein");
    expect(result[0].bookings).toHaveLength(1);
  });
});

describe("the proof a mail opens the page at (ECCdigital/tickets#826)", () => {
  it("reads booking and field off the query", () => {
    expect(proofTargetOf({ booking: "B1", field: "f1" })).toEqual({
      bookingId: "B1",
      fieldId: "f1",
    });
    expect(proofTargetOf({ booking: ["B1", "B2"] })).toEqual({
      bookingId: "B1",
      fieldId: null,
    });
    expect(proofTargetOf({ field: "f1" })).toBe(null);
    expect(proofTargetOf({})).toBe(null);
    expect(proofTargetOf(undefined)).toBe(null);
  });

  it("names a booking's section and its fields by safe ids", () => {
    expect(proofAnchorId("B1")).toBe("proof-B1");
    expect(proofAnchorId("B1", "test824-ausweis")).toBe(
      "proof-B1-test824-ausweis",
    );
    expect(proofAnchorId("B 1", "a/b")).toBe("proof-B_1-a_b");
  });
});

describe("the way to a proof from the card and the details (ECCdigital/tickets#826)", () => {
  const withFields = (...states) => ({
    id: "B1",
    customerUploadState: {
      fields: states.map((state, index) => ({ fieldId: `f${index}`, state })),
    },
  });

  it("opens the page at the booking and the field", () => {
    expect(proofPageLink("B1", "f1")).toEqual({
      path: "/account/proofs",
      query: { booking: "B1", field: "f1" },
    });
    expect(proofPageLink("B1")).toEqual({
      path: "/account/proofs",
      query: { booking: "B1" },
    });
  });

  it("leads the card to the most urgent field: rejected, overdue, open, submitted", () => {
    expect(
      mostUrgentProofFieldOf(
        withFields("submitted", "open", "overdue", "rejected"),
      ),
    ).toBe("f3");
    expect(mostUrgentProofFieldOf(withFields("open", "overdue"))).toBe("f1");
    expect(mostUrgentProofFieldOf(withFields("fulfilled", "submitted"))).toBe(
      "f1",
    );
    expect(mostUrgentProofFieldOf(withFields("fulfilled"))).toBe(null);
    expect(mostUrgentProofFieldOf({ id: "B1" })).toBe(null);
  });
});
