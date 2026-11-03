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

/**
 * The reason of a new booking attempt for an offer the backend no longer
 * delivers: withdrawn, never existed or not reachable under the tenant
 * supervision. The backend deliberately names no cause.
 */
export const BOOKABLE_NOT_FOUND = "checkout.bookable_not_found";

/**
 * The reason of a checkout that refused an address on the blacklist.
 * The backend's answer carries the instance's
 * `mailAddress` in `params`, empty where the instance has none.
 */
export const ADDRESS_BLACKLISTED = "checkout.address_blacklisted";

/**
 * The refusal of an address on the blacklist: whom to write to with
 * questions, the instance's mail address or, without one, the operator of
 * the offer.
 *
 * @param {{ mailAddress?: string }|undefined} params The `params` of the refusal
 * @param {Function} t The translate function of vue-i18n
 * @returns {string}
 */
export function addressBlacklistedMessage(params, t) {
  return t(ADDRESS_BLACKLISTED, {
    contact:
      addressBlacklistedContact(params) ||
      t("checkout.address_blacklisted_operator"),
  });
}

/**
 * The instance's mail address of the refusal of an address on the
 * blacklist, trimmed; empty where the instance has none.
 *
 * @param {{ mailAddress?: string }|undefined} params The `params` of the refusal
 * @returns {string}
 */
export function addressBlacklistedContact(params) {
  return typeof params?.mailAddress === "string"
    ? params.mailAddress.trim()
    : "";
}

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
 * The refusal of an address on the blacklist from the BFF's error, as the
 * registration answers it - the checkout's reason
 * with the instance's mail address: that address, trimmed, empty where the
 * instance has none; null for any other failure.
 *
 * @param {unknown} error The rejected `$fetch` of a BFF route
 * @returns {string|null}
 */
export function addressBlacklistedRefusalOf(error) {
  const body = backendErrorBodyOf(error);
  if (body?.error !== ADDRESS_BLACKLISTED) return null;
  return addressBlacklistedContact(body.params);
}

/**
 * The i18n key for a checkout request the backend refused with an error
 * status, null when the failure names no cause (an infrastructure error).
 * A 404 is an offer or tenant the backend no longer delivers; no distinction
 * between never existed, withdrawn and a tenant that is not public (pending
 * approval or declined).
 */
export function resolveCheckoutFailureKey(error) {
  const body = backendErrorBodyOf(error);
  if (body?.success === false && isRecord(body.error)) {
    return resolveCheckoutErrorKey(body.error);
  }
  return error?.statusCode === 404 ? BOOKABLE_NOT_FOUND : null;
}
