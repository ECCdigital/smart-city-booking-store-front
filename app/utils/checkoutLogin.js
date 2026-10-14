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
export function checkoutAuthAction({ isLoggedIn, requiresLogin }) {
  if (!isLoggedIn) return "login";
  return requiresLogin ? null : "guest";
}

function statusOf(failure) {
  return failure?.statusCode ?? failure?.status ?? failure?.response?.status;
}

/**
 * The one rule for "401 = sign-in needed", for the pre-check and the
 * completion alike: the backend refused for want of a sign-in. That is the
 * reason `checkout.login_required`, as its 401 carries it (backend 4.3.1) or
 * in an answer without an error status. A 401 without it counts once nobody
 * is signed in: `useApiClient` has checked the session by then, so the token
 * renewal was refused or failed and the person is signed out (#108). While
 * the person is still signed in, or the state is unknown, it does not.
 *
 * @param {object|null} failure The `error` of a failed BFF request, or the
 *   body of an answer with `success: false`
 * @param {{ isLoggedIn?: boolean }} [auth] The sign-in state after the request
 */
export function isLoginRefusal(failure, { isLoggedIn } = {}) {
  if (!failure || typeof failure !== "object") return false;
  const body = backendErrorBodyOf(failure) ?? failure;
  if (
    body?.success === false &&
    LOGIN_REQUIRED_REASONS.has(body?.error?.reason)
  ) {
    return true;
  }
  return isLoggedIn === false && statusOf(failure) === 401;
}

const permissionRefusal = (reason) => ({
  success: false,
  error: { checkType: "permissions", reason },
});

/**
 * The pre-check's answer to a failed request for the permissions: the
 * backend's own permission refusal, a sign-in after `isLoginRefusal`, a
 * denied permission on a 403, null for any other failure.
 *
 * @param {object} failure The `error` of the failed BFF request
 * @param {{ isLoggedIn?: boolean }} [auth] The sign-in state after the request
 */
export function permissionCheckOfFailure(failure, auth) {
  const body = backendErrorBodyOf(failure);
  if (body?.success === false && body?.error?.checkType === "permissions") {
    return body;
  }
  if (isLoginRefusal(failure, auth)) return permissionRefusal(LOGIN_REQUIRED);
  if (statusOf(failure) === 403) {
    return permissionRefusal("checkout.permission_denied");
  }
  return null;
}
