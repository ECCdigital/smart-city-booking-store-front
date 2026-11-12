/**
 * Customer uploads (glossary "Kunden-Upload", in the UI "Nachweis") as
 * the storefront shows them. The backend derives
 * the state of each upload field and of the booking and sends it with every
 * booking as `customerUploadState`; these functions only read it - no rule
 * of its own for deadlines.
 *
 * @typedef {Object} CustomerUploadField
 * @property {string} fieldId
 * @property {string} label
 * @property {string} hint
 * @property {string} consentText
 * @property {boolean} required
 * @property {string} category `normal` or `sensitive`
 * @property {number} maxFiles
 * @property {string[]} formats Out of `pdf`, `jpeg`, `png`
 * @property {number} maxFileSizeMb
 * @property {number|null} deadline Epoch milliseconds
 * @property {boolean} pastDeadline
 * @property {string} state One of {@link CUSTOMER_UPLOAD_FIELD_STATE}
 * @property {number} remainingFiles
 * @property {{ kind: string, reason: string, at: number }|null} reopen What
 *   opened the field again and is not answered yet: a rejection
 *   (`rejected`) or „Erneut anfordern“ (`requestedAgain`)
 * @property {Array<{ mediaId: string, originalFileName: string, size: number,
 *   mimeType: string, uploadedAt: number, review: { status: string,
 *   reason: string, reviewedAt: number|null, fileDeleted: boolean,
 *   autoDeleted: boolean } }>} uploads
 */

export const CUSTOMER_UPLOAD_FIELD_STATE = Object.freeze({
  OPEN: "open",
  SUBMITTED: "submitted",
  REJECTED: "rejected",
  OVERDUE: "overdue",
  FULFILLED: "fulfilled",
});

const S = CUSTOMER_UPLOAD_FIELD_STATE;
const DAY = 24 * 60 * 60 * 1000;
const MEGABYTE = 1024 * 1024;
/** From this many days before the deadline an open field stands out. */
export const DEADLINE_WARNING_DAYS = 3;

const FORMATS = Object.freeze({
  pdf: { mimeTypes: ["application/pdf"], extensions: ["pdf"] },
  jpeg: { mimeTypes: ["image/jpeg"], extensions: ["jpg", "jpeg"] },
  png: { mimeTypes: ["image/png"], extensions: ["png"] },
});

/** The `accept` attribute of a file input for the formats of a field. */
export function acceptOf(formats = []) {
  return formats
    .flatMap((format) => [
      ...(FORMATS[format]?.mimeTypes ?? []),
      ...(FORMATS[format]?.extensions ?? []).map((ext) => `.${ext}`),
    ])
    .join(",");
}

/** The formats of a field as the page names them: `PDF, JPEG`. */
export function formatsLabel(formats = []) {
  return formats.map((format) => format.toUpperCase()).join(", ");
}

/**
 * The format of a chosen file: by its type, by its extension where the
 * browser names no type. The backend decides by the content.
 *
 * @param {{ name?: string, type?: string }} file
 * @returns {string|null}
 */
export function formatOfFile(file) {
  const type = String(file?.type ?? "").toLowerCase();
  const extension = String(file?.name ?? "")
    .toLowerCase()
    .split(".")
    .pop();
  for (const [format, { mimeTypes, extensions }] of Object.entries(FORMATS)) {
    if (type ? mimeTypes.includes(type) : extensions.includes(extension)) {
      return format;
    }
  }
  return null;
}

/**
 * What the page checks before a file is sent, in the backend's order and
 * with its codes: size, number, format.
 *
 * @param {{ name?: string, type?: string, size: number }} file
 * @param {CustomerUploadField} field
 * @param {{ replacing?: boolean }} [options] A replacement takes the place
 *   of a file, so the number does not grow.
 * @returns {{ code: string, params: Object }|null} Null when it may go.
 */
export function precheckCustomerUpload(
  file,
  field,
  { replacing = false } = {},
) {
  if (file.size > field.maxFileSizeMb * MEGABYTE) {
    return {
      code: "customer_upload_too_large",
      params: { maxFileSizeMb: field.maxFileSizeMb },
    };
  }
  if (!replacing && field.remainingFiles <= 0) {
    return {
      code: "customer_upload_field_full",
      params: { maxFiles: field.maxFiles },
    };
  }
  if (!field.formats.includes(formatOfFile(file))) {
    return {
      code: "customer_upload_format_not_allowed",
      params: { formats: field.formats },
    };
  }
  return null;
}

/**
 * The form field of a proof handed in with the button „Nachweise
 * einreichen“: `customerUpload:<fieldId>`, a
 * replacement `customerUpload:<fieldId>:<mediaId>`.
 *
 * @param {{fieldId: string, replacing?: string|null}} draft
 */
export function submissionPartName({ fieldId, replacing = null }) {
  return `${CHECKOUT_FILE_PREFIX}${fieldId}${replacing ? `:${replacing}` : ""}`;
}

/**
 * The chosen proofs in the order the backend reads them: grouped by form
 * field in the order each field first comes, as it groups the files of a
 * request. The backend names a refused file by its position in this order.
 *
 * @template {{fieldId: string, replacing?: string|null}} T
 * @param {T[]} drafts
 * @returns {T[]}
 */
export function submissionOrderOf(drafts = []) {
  const byPart = new Map();
  for (const draft of drafts) {
    const name = submissionPartName(draft);
    if (!byPart.has(name)) byPart.set(name, []);
    byPart.get(name).push(draft);
  }
  return [...byPart.values()].flat();
}

/**
 * The multipart body of every proof of a booking at once: each chosen file
 * under {@link submissionPartName}, in {@link submissionOrderOf}.
 *
 * @param {Array<{fieldId: string, replacing?: string|null, file: File}>} drafts
 * @returns {FormData}
 */
export function submissionFormOf(drafts = []) {
  const form = new FormData();
  const ordered = submissionOrderOf(drafts);
  const alsoFor = submissionAlsoForOf(ordered);
  if (Object.keys(alsoFor).length > 0) {
    form.append("alsoFor", JSON.stringify(alsoFor));
  }
  for (const draft of ordered) {
    form.append(submissionPartName(draft), draft.file, draft.file.name);
  }
  return form;
}

/**
 * The other bookings of the series each new file counts for too,
 * by its position in {@link submissionOrderOf}:
 * the form field `alsoFor` of „Nachweise einreichen“. A replacement counts
 * for its own booking alone.
 *
 * @param {Array<{replacing?: string|null, alsoFor?: Array<{bookingId: string, fieldId: string}>}>} ordered
 * @returns {Record<number, Array<{bookingId: string, fieldId: string}>>}
 */
export function submissionAlsoForOf(ordered = []) {
  const alsoFor = {};
  ordered.forEach((draft, index) => {
    if (draft.replacing || !draft.alsoFor?.length) return;
    alsoFor[index] = draft.alsoFor.map(({ bookingId, fieldId }) => ({
      bookingId,
      fieldId,
    }));
  });
  return alsoFor;
}

/**
 * The upload fields of the other bookings of a booking's series a new file
 * can count for too: every field of those
 * bookings with room for a file and not fulfilled, by their begin. Those
 * of the same field are preset - there is no rule which fields are "the
 * same", so the customer may change it. With the file, only the fields that
 * take it by size and format. None outside a series.
 *
 * @param {Object} booking The booking the file is chosen at
 * @param {Object[]} bookings The customer's bookings
 * @param {string} fieldId The field the file is chosen for
 * @param {{ name?: string, type?: string, size: number }|null} [file]
 * @returns {Array<{bookingId: string, fieldId: string, fieldLabel: string, timeBegin: number|null, timeEnd: number|null, preset: boolean}>}
 */
export function seriesTargetOptionsOf(
  booking,
  bookings = [],
  fieldId,
  file = null,
) {
  const members = new Set(
    booking?.customerUploadState?.group?.bookingIds ?? [],
  );
  members.delete(booking?.id);
  if (members.size === 0) return [];
  return bookings
    .filter((other) => members.has(other.id))
    .sort((a, b) => (a.timeBegin ?? 0) - (b.timeBegin ?? 0))
    .flatMap((other) =>
      customerUploadFieldsOf(other)
        .filter(
          (field) =>
            field.state !== S.FULFILLED &&
            (field.remainingFiles ?? 0) > 0 &&
            (!file || precheckCustomerUpload(file, field) === null),
        )
        .map((field) => ({
          bookingId: other.id,
          fieldId: field.fieldId,
          fieldLabel: field.label,
          timeBegin: other.timeBegin ?? null,
          timeEnd: other.timeEnd ?? null,
          preset: field.fieldId === fieldId,
        })),
    );
}

/**
 * What the answer of „Nachweise einreichen“ means for the files sent: the
 * ids of those stored, and per refused one its id with its refusal.
 *
 * @param {Array<{id: number}>} sent The drafts in {@link submissionOrderOf}
 * @param {Array<{index: number, code: string, params?: Object}>} refused
 * @returns {{storedIds: number[], refusals: Array<{id: number, refusal: {code: string, params: Object}}>}}
 */
export function submissionOutcomeOf(sent = [], refused = []) {
  const refusals = refused
    .filter((entry) => sent[entry.index])
    .map((entry) => ({
      id: sent[entry.index].id,
      refusal: { code: entry.code, params: entry.params ?? {} },
    }));
  const refusedIds = new Set(refusals.map((entry) => entry.id));
  return {
    storedIds: sent
      .map((draft) => draft.id)
      .filter((id) => !refusedIds.has(id)),
    refusals,
  };
}

/**
 * An upload field as the page shows it while files are chosen but not
 * handed in: each new file takes a place of the field, a replacement none.
 *
 * @param {Object} field Of the derived state
 * @param {Array<{fieldId: string, replacing?: string|null}>} drafts Of the
 *   field's booking
 * @returns {Object}
 */
export function fieldWithDrafts(field, drafts = []) {
  const added = drafts.filter(
    (draft) => draft.fieldId === field.fieldId && !draft.replacing,
  ).length;
  if (added === 0) return field;
  return {
    ...field,
    remainingFiles: Math.max(0, (field.remainingFiles ?? 0) - added),
  };
}

/** Whole days until a deadline, never below 0. */
export function daysLeft(deadline, now = Date.now()) {
  if (deadline === null || deadline === undefined) return null;
  return Math.max(0, Math.ceil((deadline - now) / DAY));
}

const lastReviewed = (field, status) =>
  [...field.uploads]
    .filter((upload) => upload.review?.status === status)
    .sort((a, b) => (b.review.reviewedAt ?? 0) - (a.review.reviewedAt ?? 0))[0];

/**
 * How the page shows one upload field: its chip, what the customer may do,
 * and the texts that go with its state.
 *
 * @param {CustomerUploadField} field
 * @param {number} [now]
 * @returns {{ state: string, color: string, labelKey: string,
 *   labelParams: Object, canUpload: boolean, canChange: boolean,
 *   lateHint: boolean, reason: string|null, reasonKey: string|null }}
 */
export function customerUploadFieldView(field, now = Date.now()) {
  const days = daysLeft(field.deadline, now);
  const base = {
    state: field.state,
    labelParams: { deadline: field.deadline, days },
    canUpload: field.remainingFiles > 0,
    canChange: false,
    lateHint: false,
    reason: null,
    reasonKey: null,
  };

  switch (field.state) {
    case S.SUBMITTED:
      return {
        ...base,
        color: "info",
        labelKey: "customerUploads.state.submitted",
        canChange: true,
      };
    case S.REJECTED: {
      // A rejection or „Erneut anfordern“: both
      // ask for a new file, each with its reason.
      const requestedAgain = field.reopen?.kind === "requestedAgain";
      return {
        ...base,
        color: "error",
        labelKey: requestedAgain
          ? "customerUploads.state.requestedAgain"
          : "customerUploads.state.rejected",
        reason:
          field.reopen?.reason ||
          lastReviewed(field, "rejected")?.review.reason ||
          null,
        reasonKey: requestedAgain
          ? "customerUploads.requestAgainReason"
          : "customerUploads.rejectionReason",
        lateHint: field.pastDeadline,
      };
    }
    case S.OVERDUE:
      return {
        ...base,
        color: "error",
        labelKey: "customerUploads.state.overdue",
        lateHint: true,
      };
    case S.FULFILLED: {
      // Only a sensitive file is deleted with its check; a normal one stays.
      const accepted = lastReviewed(field, "accepted");
      return {
        ...base,
        color: "success",
        labelKey: accepted?.review.fileDeleted
          ? "customerUploads.state.fulfilled"
          : "customerUploads.state.fulfilledKept",
        labelParams: { reviewedAt: accepted?.review.reviewedAt ?? null },
        canUpload: false,
      };
    }
    default:
      return {
        ...base,
        color:
          days !== null && days <= DEADLINE_WARNING_DAYS
            ? "warning"
            : "neutral",
        labelKey:
          field.deadline === null
            ? "customerUploads.state.openWithoutDeadline"
            : "customerUploads.state.open",
      };
  }
}

/** The upload fields of a booking, as its answer carries them. */
export function customerUploadFieldsOf(booking) {
  return booking?.customerUploadState?.fields ?? [];
}

/** The states of the booking, as the backend derives them over its required fields. */
const BOOKING_PROOF_STATE = Object.freeze({
  OVERDUE: "overdue",
  MISSING: "missing",
});

/** The states of a field that still wants a file from the customer. */
const MISSING_FIELD_STATES = [S.OPEN, S.REJECTED, S.OVERDUE];

const earliest = (deadlines) => {
  const known = deadlines.filter((deadline) => typeof deadline === "number");
  return known.length ? Math.min(...known) : null;
};

/**
 * The required proofs of a booking still missing:
 * read off the backend's state of the booking (`missing` or `overdue`) and
 * its required fields that are open, rejected or overdue - no rule of its
 * own for deadlines. Null where nothing required is missing.
 *
 * @param {Object} booking As `GET /api/bookings` answers it
 * @returns {{ count: number, deadline: number|null, overdue: boolean,
 *   nextDeadline: number|null }|null} `deadline` is the earliest deadline of
 *   the missing fields, `nextDeadline` the earliest one not passed yet,
 *   `overdue` whether the backend counts the booking overdue.
 */
export function missingProofsOf(booking) {
  const state = booking?.customerUploadState?.state;
  if (
    state !== BOOKING_PROOF_STATE.MISSING &&
    state !== BOOKING_PROOF_STATE.OVERDUE
  ) {
    return null;
  }
  const fields = customerUploadFieldsOf(booking).filter(
    (field) => field.required && MISSING_FIELD_STATES.includes(field.state),
  );
  if (fields.length === 0) return null;
  return {
    count: fields.length,
    deadline: earliest(fields.map((field) => field.deadline)),
    nextDeadline: earliest(
      fields
        .filter((field) => !field.pastDeadline)
        .map((field) => field.deadline),
    ),
    overdue: state === BOOKING_PROOF_STATE.OVERDUE,
  };
}

/**
 * The chip „N Nachweise fehlen · bis …“ on the card of „Meine Buchungen“:
 * the number of missing required proofs and
 * their earliest deadline, red once the backend counts the booking
 * overdue. Null where nothing required is missing.
 *
 * @param {Object} booking
 * @returns {{ count: number, deadline: number|null, color: string,
 *   labelKey: string }|null}
 */
export function missingProofsChipOf(booking) {
  const missing = missingProofsOf(booking);
  if (!missing) return null;
  return {
    count: missing.count,
    deadline: missing.deadline,
    color: missing.overdue ? "error" : "warning",
    labelKey:
      missing.deadline === null
        ? "customerUploads.missingChip.withoutDeadline"
        : "customerUploads.missingChip.withDeadline",
  };
}

/**
 * The banner „Für N Buchungen fehlen noch Nachweise“ above „Meine
 * Buchungen“: how many bookings miss a required
 * proof and the next deadline among them not passed yet; without one, only
 * passed deadlines are left (`overdue`). Null where no booking misses one.
 *
 * @param {Object[]} bookings As `GET /api/bookings` answers them
 * @returns {{ bookingCount: number, nextDeadline: number|null,
 *   overdue: boolean }|null}
 */
export function missingProofsBannerOf(bookings = []) {
  const missing = missingProofBookingsOf(bookings);
  if (missing.length === 0) return null;
  return {
    bookingCount: missing.length,
    nextDeadline: earliest(missing.map((entry) => entry.nextDeadline)),
    overdue: missing.some((entry) => entry.overdue),
  };
}

/**
 * The bookings whose required proofs are still missing, for the dialog of
 * the banner above „Meine Buchungen“: each with {@link missingProofsOf},
 * the earliest deadline first, a passed one before the rest, then the
 * earlier start; a booking without a deadline last.
 *
 * @param {Object[]} bookings As `GET /api/bookings` answers them
 * @returns {Array<{ booking: Object, count: number, deadline: number|null,
 *   overdue: boolean, nextDeadline: number|null }>}
 */
export function missingProofBookingsOf(bookings = []) {
  const at = (value) => (typeof value === "number" ? value : Infinity);
  return bookings
    .map((booking) => {
      const missing = missingProofsOf(booking);
      return missing ? { booking, ...missing } : null;
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        at(a.deadline) - at(b.deadline) ||
        at(a.booking.timeBegin) - at(b.booking.timeBegin),
    );
}

/**
 * Whether the page „Nachweise einreichen“ has something for a booking: a
 * field that is not checked.
 */
export function hasPendingProofs(booking) {
  return customerUploadFieldsOf(booking).some(
    (field) => field.state !== S.FULFILLED,
  );
}

/**
 * The fields the page „Nachweise einreichen“ shows for a booking: every one
 * that is not checked. A checked field is only in the booking details.
 *
 * @param {Object} booking
 * @returns {CustomerUploadField[]}
 */
export function pendingProofFieldsOf(booking) {
  return customerUploadFieldsOf(booking).filter(
    (field) => field.state !== S.FULFILLED,
  );
}

/** What the customer has to do first: rejected, overdue, open, submitted. */
const URGENCY = [S.REJECTED, S.OVERDUE, S.OPEN, S.SUBMITTED];

const ERROR_KEYS = Object.freeze({
  customer_upload_format_not_allowed: "format",
  customer_upload_too_large: "size",
  customer_upload_field_full: "fieldFull",
  customer_upload_required_missing: "requiredMissing",
  customer_upload_booking_limit: "bookingLimit",
  customer_upload_virus_found: "virus",
  customer_upload_scanner_unavailable: "scanner",
  customer_upload_rate_limited: "rateLimit",
  customer_upload_not_open: "notOpen",
  customer_upload_already_reviewed: "alreadyReviewed",
  customer_upload_file_missing: "fileMissing",
  customer_upload_field_not_found: "notFound",
  customer_upload_not_found: "notFound",
  booking_not_found: "notFound",
  customer_upload_link_invalid: "linkInvalid",
  customer_upload_link_expired: "linkExpired",
  customer_upload_target_invalid: "targetInvalid",
});

/**
 * Why the page of a guest's signed link shows no
 * booking, from the code the backend refuses the link with: `expired` after
 * the end of the booking, `invalid` for any other link, `error` for
 * anything else.
 *
 * @param {string|undefined} code
 * @returns {"expired"|"invalid"|"error"}
 */
export function linkRefusalOf(code) {
  if (code === "customer_upload_link_expired") return "expired";
  if (code === "customer_upload_link_invalid") return "invalid";
  return "error";
}

/**
 * The message key of a refusal, from the code the backend (or the page's own
 * check) answers; a generic one for anything else.
 *
 * @param {string|undefined} code
 * @returns {string}
 */
export function customerUploadErrorKey(code) {
  return `customerUploads.errors.${ERROR_KEYS[code] ?? "generic"}`;
}

/**
 * The code and parameters of a failed upload request as `useApiClient`
 * hands it back: `error.data` is the Nitro error, whose `data` is the
 * backend's error body (or the BFF's own refusal in the same shape).
 *
 * @param {{ statusCode?: number, data?: Object }|null} error
 * @returns {{ code: string|undefined, params: Object }}
 */
export function customerUploadErrorOf(error) {
  const body = error?.data?.data ?? error?.data ?? {};
  if (error?.statusCode === 429 && !body.code) {
    return { code: "customer_upload_rate_limited", params: {} };
  }
  return { code: body.code, params: body.params ?? {} };
}

/**
 * The upload fields a checkout asks for, as the
 * backend answers them with the offer: those "in the checkout", only while
 * the tenant has customer uploads on, each with the size limit that counts.
 *
 * @param {Object|null} bookable The offer of `GET /api/checkout/:id`
 * @returns {Array<{ id: string, label: string, hint: string,
 *   consentText: string, required: boolean, maxFiles: number,
 *   formats: string[], maxFileSizeMb: number }>}
 */
export function checkoutUploadFieldsOf(bookable) {
  const fields = bookable?.checkoutUploadFields;
  return Array.isArray(fields) ? fields : [];
}

/**
 * What the checkout checks before a file is added to a field: size,
 * number, format, as on the page „Nachweise einreichen“.
 *
 * @param {{ name?: string, type?: string, size: number }} file
 * @param {Object} field An upload field of {@link checkoutUploadFieldsOf}
 * @param {number} chosen The files already chosen for the field
 * @returns {{ code: string, params: Object }|null} Null when it may go.
 */
export function precheckCheckoutUpload(file, field, chosen) {
  return precheckCustomerUpload(file, {
    ...field,
    remainingFiles: field.maxFiles - chosen,
  });
}

/**
 * The required upload fields of the checkout without a file.
 *
 * @param {Object[]} fields
 * @param {Record<string, File[]>} files The chosen files by field id
 * @returns {Object[]}
 */
export function missingCheckoutUploads(fields, files) {
  return fields.filter(
    (field) => field.required && !(files?.[field.id]?.length > 0),
  );
}

/** The form field of a multipart checkout that carries its JSON body. */
export const CHECKOUT_BODY_FIELD = "checkout";
/** The prefix of a file's form field; the id of its upload field follows. */
export const CHECKOUT_FILE_PREFIX = "customerUpload:";

/**
 * The parts of a multipart checkout, in their order: the checkout as JSON,
 * then each file under its field.
 *
 * @param {Object} body The checkout's body
 * @param {Record<string, File[]>} files The chosen files by field id
 * @returns {Array<[string, string|File]>}
 */
export function checkoutUploadParts(body, files) {
  const parts = [[CHECKOUT_BODY_FIELD, JSON.stringify(body)]];
  for (const [fieldId, chosen] of Object.entries(files || {})) {
    for (const file of chosen || []) {
      parts.push([`${CHECKOUT_FILE_PREFIX}${fieldId}`, file]);
    }
  }
  return parts;
}

/** Whether there is any file to send with the checkout. */
export function hasCheckoutUploads(files) {
  return Object.values(files || {}).some((chosen) => chosen?.length > 0);
}

const CHECKOUT_UPLOAD_REASONS = Object.freeze([
  "checkout.customer_upload_refused",
  "checkout.customer_upload_required",
]);

/**
 * A refused checkout as a refused customer upload: the backend's reasons
 * of the checkout (`error.reason` with the code in `params`), and the
 * storefront's own refusal before the backend (`code`).
 *
 * @param {Object|null} apiError `data.error` of the checkout, or the body
 *   of a failed request
 * @returns {{ code: string, params: Object }|null} Null for any other
 *   refusal.
 */
export function checkoutUploadRefusalOf(apiError) {
  if (!apiError || typeof apiError !== "object") return null;
  const params = apiError.params ?? {};
  if (CHECKOUT_UPLOAD_REASONS.includes(apiError.reason)) {
    return { code: params.code, params };
  }
  if (
    typeof apiError.code === "string" &&
    apiError.code.startsWith("customer_upload_")
  ) {
    return { code: apiError.code, params };
  }
  return null;
}

/** The title of a booking's bookable, empty without one. */
export function proofBookingTitleOf(booking) {
  return booking?.bookableItems?.[0]?._bookableUsed?.title ?? "";
}

/**
 * The proof the page „Nachweise einreichen“ opens at, from its query: the
 * button of the mail on a rejection or „Erneut anfordern“ names the
 * booking and the upload field (`?booking=…&field=…`).
 *
 * @param {Object} query The route's query
 * @returns {{ bookingId: string, fieldId: string|null }|null}
 */
export function proofTargetOf(query = {}) {
  const one = (value) => (Array.isArray(value) ? value[0] : value);
  const bookingId = one(query?.booking);
  const fieldId = one(query?.field);
  if (typeof bookingId !== "string" || !bookingId) return null;
  return {
    bookingId,
    fieldId: typeof fieldId === "string" && fieldId ? fieldId : null,
  };
}

/** The element id of a booking's section, or of one of its fields. */
export function proofAnchorId(bookingId, fieldId = null) {
  const safe = (value) => String(value).replace(/[^A-Za-z0-9_-]/g, "_");
  return fieldId
    ? `proof-${safe(bookingId)}-${safe(fieldId)}`
    : `proof-${safe(bookingId)}`;
}

/**
 * The way to the page „Nachweise einreichen“, opened at a booking and, where
 * named, at one of its upload fields - as the mail's button does.
 *
 * @param {string} bookingId
 * @param {string|null} [fieldId]
 * @returns {{ path: string, query: Object }}
 */
export function proofPageLink(bookingId, fieldId = null) {
  const query = { booking: bookingId };
  if (fieldId) query.field = fieldId;
  return { path: "/account/proofs", query };
}

/**
 * The upload field of a booking the card leads to: the most urgent one not
 * checked, in the order of {@link URGENCY}; null while all are checked.
 *
 * @param {Object} booking
 * @returns {string|null} Its `fieldId`
 */
export function mostUrgentProofFieldOf(booking) {
  const fields = customerUploadFieldsOf(booking);
  for (const state of URGENCY) {
    const field = fields.find((candidate) => candidate.state === state);
    if (field) return field.fieldId;
  }
  return null;
}

/*
 * The upload fields "in the checkout" of a series:
 * the customer hands a file in once and chooses the bookings of the series
 * it counts for, each with the field the file was chosen for. A file of the
 * series is `{ key, fieldId, file, attempts }`, `attempts` the indices of
 * the series' booking attempts. A guest has no choice: each of their files
 * is for one booking.
 */

/** A key for a new file of the series, unique among `uploads`. */
export function groupUploadKey(uploads = []) {
  const taken = new Set(uploads.map((upload) => upload.key));
  let n = uploads.length + 1;
  while (taken.has(`file-${n}`)) n += 1;
  return `file-${n}`;
}

/** The files of the series chosen for a field at one booking attempt. */
export function groupFilesAt(uploads, attempt, fieldId) {
  return (uploads || []).filter(
    (upload) => upload.fieldId === fieldId && upload.attempts.includes(attempt),
  );
}

/**
 * The bookings a new file of a field is for, before the customer changes
 * it: every booking with room left in the field, a guest's first one.
 */
export function defaultGroupAttempts(field, uploads, memberCount, guest) {
  const withRoom = [...Array(memberCount).keys()].filter(
    (attempt) =>
      groupFilesAt(uploads, attempt, field.id).length < field.maxFiles,
  );
  return guest ? withRoom.slice(0, 1) : withRoom;
}

/**
 * What the series checkout checks before a file is added, as for a single
 * booking: size and format of the file, the number at each of its bookings.
 *
 * @returns {{ code: string, params: Object }|null} Null when it may go.
 */
export function precheckGroupCheckoutUpload(file, field, attempts, uploads) {
  const ofFile = precheckCheckoutUpload(file, field, 0);
  if (ofFile) return ofFile;
  const full =
    attempts.length === 0
      ? -1
      : attempts.find(
          (attempt) =>
            groupFilesAt(uploads, attempt, field.id).length >= field.maxFiles,
        );
  if (full === undefined) return null;
  return {
    code: "customer_upload_field_full",
    params: {
      maxFiles: field.maxFiles,
      ...(full >= 0 ? { attempt: full } : {}),
    },
  };
}

/**
 * The required upload fields of the checkout without a file, per booking
 * attempt of the series.
 *
 * @returns {{ attempt: number, field: Object }[]}
 */
export function missingGroupCheckoutUploads(fields, uploads, memberCount) {
  const missing = [];
  for (let attempt = 0; attempt < memberCount; attempt += 1) {
    for (const field of fields) {
      if (
        field.required &&
        groupFilesAt(uploads, attempt, field.id).length === 0
      ) {
        missing.push({ attempt, field });
      }
    }
  }
  return missing;
}

/**
 * `customerUploadTargets` of a series checkout: by the key of each file its
 * bookings, each with the file's field.
 */
export function customerUploadTargetsOf(uploads) {
  return Object.fromEntries(
    (uploads || []).map((upload) => [
      upload.key,
      upload.attempts.map((attempt) => ({ attempt, fieldId: upload.fieldId })),
    ]),
  );
}

/**
 * The parts of a multipart series checkout: the checkout with its targets
 * as JSON, then each file under its key.
 *
 * @returns {Array<[string, string|File]>}
 */
export function groupCheckoutUploadParts(body, uploads) {
  return [
    [
      CHECKOUT_BODY_FIELD,
      JSON.stringify({
        ...body,
        customerUploadTargets: customerUploadTargetsOf(uploads),
      }),
    ],
    ...(uploads || []).map((upload) => [
      `${CHECKOUT_FILE_PREFIX}${upload.key}`,
      upload.file,
    ]),
  ];
}
