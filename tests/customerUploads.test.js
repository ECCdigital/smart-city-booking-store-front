import { describe, expect, it } from "vitest";

import {
  mostUrgentProofFieldOf,
  proofAnchorId,
  proofPageLink,
  proofTargetOf,
  acceptOf,
  filterProofGroups,
  checkoutUploadFieldsOf,
  checkoutUploadParts,
  checkoutUploadRefusalOf,
  customerUploadErrorKey,
  customerUploadErrorOf,
  customerUploadFieldView,
  daysLeft,
  formatOfFile,
  hasCheckoutUploads,
  hasPendingProofs,
  linkRefusalOf,
  missingCheckoutUploads,
  missingProofsBannerOf,
  missingProofsChipOf,
  missingProofsOf,
  pendingProofGroups,
  precheckCheckoutUpload,
  precheckCustomerUpload,
  customerUploadTargetsOf,
  defaultGroupAttempts,
  groupCheckoutUploadParts,
  groupFilesAt,
  groupUploadKey,
  missingGroupCheckoutUploads,
  precheckGroupCheckoutUpload,
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
      labelKey: "customerUploads.state.fulfilledKept",
      labelParams: { reviewedAt: 1234 },
      canUpload: false,
    });
  });

  it("says the file is deleted only where the check deleted it", () => {
    const accepted = upload("accepted", 1234);
    accepted.review.fileDeleted = true;
    expect(
      customerUploadFieldView(
        field({ state: "fulfilled", uploads: [accepted] }),
        NOW,
      ),
    ).toMatchObject({
      labelKey: "customerUploads.state.fulfilled",
      labelParams: { reviewedAt: 1234 },
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

describe("the upload fields of the checkout (ECCdigital/tickets#827)", () => {
  const checkoutField = (overrides = {}) => ({
    id: "f1",
    label: "Vereinsausweis",
    hint: "",
    consentText: "",
    required: true,
    maxFiles: 2,
    formats: ["pdf", "jpeg"],
    maxFileSizeMb: 1,
    ...overrides,
  });
  const pdf = (size = 1000, name = "ausweis.pdf") => ({
    name,
    type: "application/pdf",
    size,
  });

  it("reads the fields off the offer, none where it names none", () => {
    expect(
      checkoutUploadFieldsOf({ checkoutUploadFields: [checkoutField()] }),
    ).toHaveLength(1);
    expect(checkoutUploadFieldsOf({})).toEqual([]);
    expect(checkoutUploadFieldsOf(null)).toEqual([]);
  });

  it("checks size, number and format before a file is taken", () => {
    const f = checkoutField();
    expect(precheckCheckoutUpload(pdf(), f, 0)).toBeNull();
    expect(precheckCheckoutUpload(pdf(2 * MB), f, 0)?.code).toBe(
      "customer_upload_too_large",
    );
    expect(precheckCheckoutUpload(pdf(), f, 2)?.code).toBe(
      "customer_upload_field_full",
    );
    expect(
      precheckCheckoutUpload(
        { name: "a.png", type: "image/png", size: 10 },
        f,
        0,
      )?.code,
    ).toBe("customer_upload_format_not_allowed");
  });

  it("names the required fields without a file", () => {
    const fields = [
      checkoutField(),
      checkoutField({ id: "f2", required: false }),
      checkoutField({ id: "f3" }),
    ];
    expect(
      missingCheckoutUploads(fields, { f1: [pdf()], f3: [] }).map((f) => f.id),
    ).toEqual(["f3"]);
    expect(missingCheckoutUploads(fields, {}).map((f) => f.id)).toEqual([
      "f1",
      "f3",
    ]);
  });

  it("puts the checkout as JSON first, then each file under its field", () => {
    const a = pdf(10, "a.pdf");
    const b = pdf(10, "b.pdf");
    const parts = checkoutUploadParts(
      { mail: "erika@example.test" },
      {
        f1: [a, b],
        f2: [],
      },
    );
    expect(parts).toEqual([
      ["checkout", JSON.stringify({ mail: "erika@example.test" })],
      ["customerUpload:f1", a],
      ["customerUpload:f1", b],
    ]);
    expect(hasCheckoutUploads({ f1: [a] })).toBe(true);
    expect(hasCheckoutUploads({ f1: [] })).toBe(false);
    expect(hasCheckoutUploads(undefined)).toBe(false);
  });

  it("reads a refused customer upload off the checkout's answer", () => {
    expect(
      checkoutUploadRefusalOf({
        reason: "checkout.customer_upload_refused",
        params: { code: "customer_upload_virus_found", fieldId: "f1" },
      }),
    ).toEqual({
      code: "customer_upload_virus_found",
      params: { code: "customer_upload_virus_found", fieldId: "f1" },
    });
    expect(
      checkoutUploadRefusalOf({
        reason: "checkout.customer_upload_required",
        params: { code: "customer_upload_required_missing", fieldIds: ["f1"] },
      })?.code,
    ).toBe("customer_upload_required_missing");
    // The storefront's own refusal before the backend.
    expect(
      checkoutUploadRefusalOf({
        code: "customer_upload_booking_limit",
        params: { maxTotalSizeMb: 100 },
      })?.code,
    ).toBe("customer_upload_booking_limit");
    expect(
      checkoutUploadRefusalOf({ reason: "checkout.event_full", params: {} }),
    ).toBeNull();
    expect(checkoutUploadRefusalOf(null)).toBeNull();
  });

  it("has a message for a missing required field", () => {
    expect(customerUploadErrorKey("customer_upload_required_missing")).toBe(
      "customerUploads.errors.requiredMissing",
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

describe("the missing proofs of „Meine Buchungen“ (ECCdigital/tickets#828)", () => {
  /** A booking with the backend's state over its required fields. */
  const bookingWith = (state, fields, overrides = {}) => ({
    id: "B-1",
    customerUploadState: { state, fields },
    ...overrides,
  });

  it("counts the required fields still to hand in, with the earliest deadline", () => {
    const booking = bookingWith("missing", [
      field({ fieldId: "a", deadline: NOW + 9 * DAY }),
      field({ fieldId: "b", state: "rejected", deadline: NOW + 4 * DAY }),
      field({ fieldId: "c", state: "submitted", deadline: NOW + 1 * DAY }),
      field({ fieldId: "d", state: "fulfilled", deadline: NOW + 1 * DAY }),
      field({ fieldId: "e", required: false, deadline: NOW + 1 * DAY }),
    ]);

    expect(missingProofsOf(booking)).toEqual({
      count: 2,
      deadline: NOW + 4 * DAY,
      nextDeadline: NOW + 4 * DAY,
      overdue: false,
    });
    expect(missingProofsChipOf(booking)).toEqual({
      count: 2,
      deadline: NOW + 4 * DAY,
      color: "warning",
      labelKey: "customerUploads.missingChip.withDeadline",
    });
  });

  it("follows the backend's state of the booking, red once it is overdue", () => {
    const booking = bookingWith("overdue", [
      field({ state: "overdue", deadline: NOW - DAY, pastDeadline: true }),
    ]);

    expect(missingProofsChipOf(booking)).toMatchObject({
      count: 1,
      deadline: NOW - DAY,
      color: "error",
    });
    expect(missingProofsOf(booking).nextDeadline).toBeNull();
  });

  it("names no deadline for a booking without a start", () => {
    const booking = bookingWith("missing", [field({ deadline: null })]);
    expect(missingProofsChipOf(booking)).toMatchObject({
      deadline: null,
      labelKey: "customerUploads.missingChip.withoutDeadline",
    });
  });

  it("shows nothing without a required field missing", () => {
    for (const booking of [
      {},
      { customerUploadState: null },
      bookingWith(null, [field({ required: false })]),
      bookingWith("toReview", [field({ state: "submitted" })]),
      bookingWith("fulfilled", [field({ state: "fulfilled" })]),
    ]) {
      expect(missingProofsOf(booking)).toBeNull();
      expect(missingProofsChipOf(booking)).toBeNull();
    }
    expect(missingProofsBannerOf([])).toBeNull();
    expect(
      missingProofsBannerOf([
        bookingWith("toReview", [field({ state: "submitted" })]),
      ]),
    ).toBeNull();
  });

  it("the banner counts the bookings and names the next deadline not passed", () => {
    const banner = missingProofsBannerOf([
      bookingWith("overdue", [
        field({ state: "overdue", deadline: NOW - DAY, pastDeadline: true }),
      ]),
      bookingWith("missing", [field({ deadline: NOW + 6 * DAY })]),
      bookingWith("missing", [
        field({ deadline: NOW + 3 * DAY }),
        field({ fieldId: "f2", deadline: NOW + 2 * DAY }),
      ]),
      bookingWith("toReview", [field({ state: "submitted" })]),
    ]);

    expect(banner).toEqual({
      bookingCount: 3,
      nextDeadline: NOW + 2 * DAY,
      overdue: true,
    });
  });

  it("the banner names no deadline where only passed ones are left", () => {
    expect(
      missingProofsBannerOf([
        bookingWith("overdue", [
          field({ state: "overdue", deadline: NOW - DAY, pastDeadline: true }),
        ]),
      ]),
    ).toEqual({ bookingCount: 1, nextDeadline: null, overdue: true });
  });
});

describe("linkRefusalOf (ECCdigital/tickets#829)", () => {
  it("tells an expired link from an invalid one and from any other failure", () => {
    expect(linkRefusalOf("customer_upload_link_expired")).toBe("expired");
    expect(linkRefusalOf("customer_upload_link_invalid")).toBe("invalid");
    expect(linkRefusalOf(undefined)).toBe("error");
    expect(linkRefusalOf("booking_not_found")).toBe("error");
  });

  it("names a refusal of the link while uploading", () => {
    expect(customerUploadErrorKey("customer_upload_link_expired")).toBe(
      "customerUploads.errors.linkExpired",
    );
    expect(customerUploadErrorKey("customer_upload_link_invalid")).toBe(
      "customerUploads.errors.linkInvalid",
    );
  });
});

describe("the files of a series checkout (ECCdigital/tickets#833)", () => {
  const card = {
    id: "card",
    label: "Vereinsausweis",
    required: true,
    maxFiles: 1,
    formats: ["pdf"],
    maxFileSizeMb: 1,
  };
  const social = { ...card, id: "social", required: false };
  const pdf = (name = "ausweis.pdf", size = 1024) => ({
    name,
    type: "application/pdf",
    size,
  });
  const upload = (key, fieldId, attempts) => ({
    key,
    fieldId,
    file: pdf(`${key}.pdf`),
    attempts,
  });

  it("gives each new file a key of its own", () => {
    expect(groupUploadKey([])).toBe("file-1");
    expect(groupUploadKey([upload("file-2", "card", [0])])).toBe("file-3");
  });

  it("counts the files of a field at each date", () => {
    const uploads = [upload("a", "card", [0, 1]), upload("b", "social", [1])];
    expect(groupFilesAt(uploads, 1, "card")).toHaveLength(1);
    expect(groupFilesAt(uploads, 2, "card")).toHaveLength(0);
  });

  it("puts a new file at every date with room, a guest's at the first", () => {
    const uploads = [upload("a", "card", [1])];
    expect(defaultGroupAttempts(card, uploads, 3, false)).toEqual([0, 2]);
    expect(defaultGroupAttempts(card, uploads, 3, true)).toEqual([0]);
  });

  it("checks size and format first, then the number at each date", () => {
    expect(
      precheckGroupCheckoutUpload(pdf("big.pdf", 2 * 1024 * 1024), card, [0], [])
        ?.code,
    ).toBe("customer_upload_too_large");
    expect(
      precheckGroupCheckoutUpload(pdf(), card, [0, 1], [upload("a", "card", [1])]),
    ).toEqual({
      code: "customer_upload_field_full",
      params: { maxFiles: 1, attempt: 1 },
    });
    expect(precheckGroupCheckoutUpload(pdf(), card, [], [])?.code).toBe(
      "customer_upload_field_full",
    );
    expect(precheckGroupCheckoutUpload(pdf(), card, [0, 1], [])).toBeNull();
  });

  it("names the required fields still missing at each date", () => {
    expect(
      missingGroupCheckoutUploads([card, social], [upload("a", "card", [0, 2])], 3),
    ).toEqual([{ attempt: 1, field: card }]);
  });

  it("sends the checkout with the targets of each file, then each file under its key", () => {
    const uploads = [upload("a", "card", [0, 1])];
    expect(customerUploadTargetsOf(uploads)).toEqual({
      a: [
        { attempt: 0, fieldId: "card" },
        { attempt: 1, fieldId: "card" },
      ],
    });
    const parts = groupCheckoutUploadParts({ mail: "x" }, uploads);
    expect(JSON.parse(parts[0][1])).toEqual({
      mail: "x",
      customerUploadTargets: customerUploadTargetsOf(uploads),
    });
    expect(parts.slice(1).map(([name, file]) => [name, file.name])).toEqual([
      ["customerUpload:a", "a.pdf"],
    ]);
  });

  it("names a refused target of the series", () => {
    expect(customerUploadErrorKey("customer_upload_target_invalid")).toBe(
      "customerUploads.errors.targetInvalid",
    );
  });
});
