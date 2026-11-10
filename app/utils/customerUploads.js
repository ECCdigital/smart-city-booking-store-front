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
    case S.FULFILLED:
      return {
        ...base,
        color: "success",
        labelKey: "customerUploads.state.fulfilled",
        labelParams: {
          reviewedAt:
            lastReviewed(field, "accepted")?.review.reviewedAt ?? null,
        },
        canUpload: false,
      };
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

/**
 * Whether the page „Nachweise einreichen“ has something for a booking: a
 * field that is not checked.
 */
export function hasPendingProofs(booking) {
  return customerUploadFieldsOf(booking).some(
    (field) => field.state !== S.FULFILLED,
  );
}

/** What the customer has to do first: rejected, overdue, open, submitted. */
const URGENCY = [S.REJECTED, S.OVERDUE, S.OPEN, S.SUBMITTED];

const rankOf = (state) => {
  const rank = URGENCY.indexOf(state);
  return rank === -1 ? URGENCY.length : rank;
};

/**
 * How urgent the proofs of a booking are: the rank of its most urgent field
 * in the order of {@link URGENCY}, then the earliest deadline among the
 * fields of that rank, then the start of the booking. Read off the
 * backend's states and deadlines - no rule of its own for deadlines.
 *
 * @param {{ booking: Object, fields: CustomerUploadField[] }} entry
 * @returns {[number, number, number]} Smaller is more urgent.
 */
export function proofUrgencyOf({ booking, fields }) {
  const rank = Math.min(...fields.map((field) => rankOf(field.state)));
  const deadlines = fields
    .filter((field) => rankOf(field.state) === rank)
    .map((field) => field.deadline)
    .filter((deadline) => typeof deadline === "number");
  return [
    rank,
    deadlines.length ? Math.min(...deadlines) : Infinity,
    booking.timeBegin ?? Infinity,
  ];
}

const compareUrgency = (a, b) => {
  const [x, y] = [proofUrgencyOf(a), proofUrgencyOf(b)];
  return x[0] - y[0] || x[1] - y[1] || x[2] - y[2];
};

/**
 * The page „Nachweise einreichen“: the fields that are not checked, by
 * booking in the order of their urgency ({@link proofUrgencyOf}), grouped by
 * tenant; a tenant stands where its most urgent booking does. A checked
 * field is only in the booking details. A booking whose fields are all
 * handed in and wait for their check is `complete`: the page shows it
 * collapsed.
 *
 * @param {Object[]} bookings As `GET /api/bookings` answers them
 * @returns {Array<{ tenant: { id: string, name: string }, bookings:
 *   Array<{ booking: Object, fields: CustomerUploadField[],
 *   complete: boolean }> }>}
 */
export function pendingProofGroups(bookings = []) {
  const entries = bookings
    .map((booking) => {
      const fields = customerUploadFieldsOf(booking).filter(
        (field) => field.state !== S.FULFILLED,
      );
      return {
        booking,
        fields,
        complete:
          fields.length > 0 &&
          fields.every((field) => field.state === S.SUBMITTED),
      };
    })
    .filter((entry) => entry.fields.length > 0)
    .sort(compareUrgency);

  const groups = new Map();
  for (const entry of entries) {
    const id = entry.booking.tenant?.id ?? entry.booking.tenantId;
    if (!groups.has(id)) {
      groups.set(id, {
        tenant: { id, name: entry.booking.tenant?.name ?? id },
        bookings: [],
      });
    }
    groups.get(id).bookings.push(entry);
  }
  return [...groups.values()];
}

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
 * The status filter of the page „Nachweise einreichen“. The options overlap
 * on purpose: „ausstehend“ is every field not handed in whose deadline has
 * not passed, so an open field and a rejected one before the deadline.
 */
export const PROOF_STATUS_FILTER = Object.freeze({
  OPEN: "open",
  OVERDUE: "overdue",
  OUTSTANDING: "outstanding",
  SUBMITTED: "submitted",
  REJECTED: "rejected",
});

/**
 * Whether an upload field matches one option of the status filter.
 *
 * @param {CustomerUploadField} field
 * @param {string} status One of {@link PROOF_STATUS_FILTER}
 * @returns {boolean}
 */
export function matchesProofStatus(field, status) {
  switch (status) {
    case PROOF_STATUS_FILTER.OPEN:
      return field.state === S.OPEN;
    case PROOF_STATUS_FILTER.OVERDUE:
      return (
        field.state === S.OVERDUE ||
        (field.state === S.REJECTED && field.pastDeadline)
      );
    case PROOF_STATUS_FILTER.OUTSTANDING:
      return (
        (field.state === S.OPEN || field.state === S.REJECTED) &&
        !field.pastDeadline
      );
    case PROOF_STATUS_FILTER.SUBMITTED:
      return field.state === S.SUBMITTED;
    case PROOF_STATUS_FILTER.REJECTED:
      return field.state === S.REJECTED;
    default:
      return false;
  }
}

const normalized = (text) =>
  String(text ?? "")
    .toLocaleLowerCase()
    .trim();

/** The title a booking box of the page shows. */
export function proofBookingTitleOf(booking) {
  return booking?.bookableItems?.[0]?._bookableUsed?.title ?? "";
}

/**
 * The page „Nachweise einreichen“ narrowed by its search and filters.
 * Search and filters narrow together. The search finds a booking by its
 * number, its title or its provider, with all its fields, and a field by
 * its label; the filters take providers, status options (any of them) and
 * „besonders schutzwürdig“. A booking without a field left and a provider
 * without a booking left are not shown.
 *
 * @param {ReturnType<typeof pendingProofGroups>} groups
 * @param {Object} [filter]
 * @param {string} [filter.query]
 * @param {string[]} [filter.tenantIds]
 * @param {string[]} [filter.statuses] Out of {@link PROOF_STATUS_FILTER}
 * @param {boolean} [filter.sensitiveOnly]
 * @returns {ReturnType<typeof pendingProofGroups>}
 */
export function filterProofGroups(
  groups,
  { query = "", tenantIds = [], statuses = [], sensitiveOnly = false } = {},
) {
  const q = normalized(query);
  const fieldPasses = (field) =>
    (statuses.length === 0 ||
      statuses.some((status) => matchesProofStatus(field, status))) &&
    (!sensitiveOnly || field.category === "sensitive");

  return groups
    .filter(
      (group) => tenantIds.length === 0 || tenantIds.includes(group.tenant.id),
    )
    .map((group) => ({
      ...group,
      bookings: group.bookings
        .map((entry) => {
          const bookingMatches =
            !q ||
            [
              entry.booking.id,
              proofBookingTitleOf(entry.booking),
              group.tenant.name,
            ]
              .map(normalized)
              .some((text) => text.includes(q));
          const fields = entry.fields.filter(
            (field) =>
              fieldPasses(field) &&
              (bookingMatches || normalized(field.label).includes(q)),
          );
          return { ...entry, fields };
        })
        .filter((entry) => entry.fields.length > 0),
    }))
    .filter((group) => group.bookings.length > 0);
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
