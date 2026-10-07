/**
 * The checkout of an offer behind a login (`requiresLogin`): whether the
 * booking needs a signed-in person, and what the data step offers next to
 * the contact form (ECCdigital/tickets#107, #123).
 */

import { backendErrorBodyOf } from "~/utils/checkoutErrors.js";

export const LOGIN_REQUIRED = "checkout.login_required";

const LOGIN_REQUIRED_REASONS = new Set([LOGIN_REQUIRED, "login_required"]);

/** Whether the pre-check of the permissions asks for a sign-in. */
export function isLoginRequiredPermissionError(result) {
  if (result?.success !== false || result?.error?.checkType !== "permissions") {
    return false;
  }
  return LOGIN_REQUIRED_REASONS.has(result?.error?.reason);
}

/**
 * Whether the booking needs a signed-in person: an offer in the checkout is
 * behind a login, the pre-check asks for a sign-in, or the backend refused
 * the completion for want of one. The offer's own flag counts for a
 * signed-in person too, whose pre-check passes.
 *
 * @param {{ permissionCheck?: object|null, bookables?: object[], refusedAtCompletion?: boolean }} params
 */
export function checkoutRequiresLogin({
  permissionCheck = null,
  bookables = [],
  refusedAtCompletion = false,
} = {}) {
  if (refusedAtCompletion) return true;
  if (isLoginRequiredPermissionError(permissionCheck)) return true;
  return (Array.isArray(bookables) ? bookables : []).some(
    (bookable) => bookable?.requiresLogin === true,
  );
}

/**
 * What the data step offers: `"login"` to a person who is not signed in,
 * `"guest"` (sign out and book as a guest) to a signed-in person where no
 * login is required, nothing to a signed-in person where it is.
 *
 * @param {{ isLoggedIn: boolean, requiresLogin: boolean }} params
 * @returns {"login"|"guest"|null}
 */
export function checkoutAuthOffer({ isLoggedIn, requiresLogin }) {
  if (!isLoggedIn) return "login";
  return requiresLogin ? null : "guest";
}

/**
 * Whether the backend refused a completion for want of a sign-in: its 401
 * (`checkout.login_required`, or a session it did not accept), or that
 * reason in an answer without an error status.
 *
 * @param {object|null} failure The `error` of a failed BFF request, or the
 *   body of an answer with `success: false`
 */
export function isLoginRefusal(failure) {
  if (!failure || typeof failure !== "object") return false;
  if (failure.statusCode === 401) return true;
  const body = backendErrorBodyOf(failure) ?? failure;
  return (
    body?.success === false && LOGIN_REQUIRED_REASONS.has(body?.error?.reason)
  );
}
