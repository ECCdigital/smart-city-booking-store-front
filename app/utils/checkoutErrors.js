const CHECKOUT_REASON_BY_CHECK_TYPE = {
  "insufficient-lead-time": "checkout.insufficient_lead_time",
};

const GENERIC_CHECKOUT_REASONS = new Set([
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
