const CHECKOUT_REASON_BY_CHECK_TYPE = {
  "insufficient-lead-time": "checkout.insufficient_lead_time",
};

const GENERIC_CHECKOUT_REASONS = new Set([
  "unknown",
  "unknown_error",
  "checkout.unknown",
  "checkout.unknown_error",
]);

/**
 * Resolves a stable i18n key for a checkout API error payload.
 * Falls back from generic `reason` to `checkType` when the backend
 * has not yet mapped a dedicated reason code.
 */
export function resolveCheckoutErrorKey(error) {
  if (!error || typeof error !== "object") {
    return "checkout.unknown_error";
  }

  const reason = error.reason;
  if (
    typeof reason === "string" &&
    reason &&
    !GENERIC_CHECKOUT_REASONS.has(reason)
  ) {
    return reason;
  }

  const checkType = error.checkType;
  if (typeof checkType === "string" && CHECKOUT_REASON_BY_CHECK_TYPE[checkType]) {
    return CHECKOUT_REASON_BY_CHECK_TYPE[checkType];
  }

  if (typeof reason === "string" && reason) {
    return reason;
  }

  return "checkout.unknown_error";
}

/** The reason of a new booking attempt the tenant supervision refuses. */
export const OFFER_NOT_REACHABLE = "checkout.offer_not_reachable";

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * The backend's error body of a failed BFF request, null when it sent none.
 * The BFF passes it on as the `data` of its own error envelope, which is the
 * `data` of the error `useApiClient` returns.
 */
export function backendErrorBodyOf(error) {
  const envelope = error?.data;
  if (!isRecord(envelope)) return null;
  return isRecord(envelope.data) ? envelope.data : null;
}

/**
 * The i18n key for a checkout request the backend refused with an error
 * status, null when the failure names no cause (an infrastructure error).
 * A 404 is an offer or tenant the backend no longer delivers; no distinction
 * between never existed, withdrawn and blocked.
 */
export function resolveCheckoutFailureKey(error) {
  const body = backendErrorBodyOf(error);
  if (body?.success === false && isRecord(body.error)) {
    return resolveCheckoutErrorKey(body.error);
  }
  return error?.statusCode === 404 ? OFFER_NOT_REACHABLE : null;
}
