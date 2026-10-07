import { describe, expect, it } from "vitest";

import {
  checkoutAuthAction,
  checkoutRequiresLogin,
  isLoginRefusal,
  permissionCheckOfFailure,
} from "~/utils/checkoutLogin.js";

/**
 * The checkout of an offer behind a login (`requiresLogin`,
 * ECCdigital/tickets#107): what the data step offers next to the contact
 * form - the sign-in, or for a signed-in person outside such an offer the
 * switch to a guest booking ("Ausloggen und als Gast fortfahren").
 */

const PRE_CHECK_PASSED = { success: true };
const PRE_CHECK_LOGIN_REQUIRED = {
  success: false,
  error: { checkType: "permissions", reason: "checkout.login_required" },
};

const room = { id: "room", requiresLogin: false };
const loginRoom = { id: "login-room", requiresLogin: true };

describe("checkoutAuthAction", () => {
  it("offers a validly signed-in person no guest booking for an offer behind a login", () => {
    const requiresLogin = checkoutRequiresLogin({
      permissionCheck: PRE_CHECK_PASSED,
      bookables: [loginRoom],
    });

    expect(checkoutAuthAction({ isLoggedIn: true, requiresLogin })).toBeNull();
  });

  it("keeps the guest booking for a signed-in person where no login is required", () => {
    const requiresLogin = checkoutRequiresLogin({
      permissionCheck: PRE_CHECK_PASSED,
      bookables: [room],
    });

    expect(checkoutAuthAction({ isLoggedIn: true, requiresLogin })).toBe(
      "guest",
    );
  });

  it("offers the sign-in to a person who is not signed in, with or without a login requirement", () => {
    expect(checkoutAuthAction({ isLoggedIn: false, requiresLogin: true })).toBe(
      "login",
    );
    expect(checkoutAuthAction({ isLoggedIn: false, requiresLogin: false })).toBe(
      "login",
    );
  });
});

describe("checkoutRequiresLogin", () => {
  it("reads the flag of every offer in the checkout, not only the lead", () => {
    expect(
      checkoutRequiresLogin({
        permissionCheck: PRE_CHECK_PASSED,
        bookables: [room, loginRoom],
      }),
    ).toBe(true);
  });

  it("follows the pre-check that asks for a sign-in", () => {
    expect(
      checkoutRequiresLogin({
        permissionCheck: PRE_CHECK_LOGIN_REQUIRED,
        bookables: [room],
      }),
    ).toBe(true);
  });

  it("follows a completion the backend refused for want of a sign-in", () => {
    expect(
      checkoutRequiresLogin({
        permissionCheck: PRE_CHECK_PASSED,
        bookables: [room],
        refusedAtCompletion: true,
      }),
    ).toBe(true);
  });

  it("needs no sign-in where nothing asks for one", () => {
    expect(
      checkoutRequiresLogin({ permissionCheck: PRE_CHECK_PASSED, bookables: [room] }),
    ).toBe(false);
    expect(checkoutRequiresLogin({})).toBe(false);
  });
});

/**
 * A failed completion reaches the page as the BFF's error: the status code
 * and, under `data`, the Nitro error envelope whose own `data` is the
 * backend's error body (ECCdigital/tickets#123).
 */
const failure = (statusCode, body) => ({
  statusCode,
  data: { statusCode, statusMessage: "", data: body },
});

describe("isLoginRefusal", () => {
  it("is the backend's 401 with checkout.login_required at the completion", () => {
    expect(
      isLoginRefusal(
        failure(401, {
          success: false,
          error: {
            reason: "checkout.login_required",
            checkType: "permissions",
            params: {},
          },
        }),
      ),
    ).toBe(true);
  });

  it("is a 401 without the reason once nobody is signed in: the renewal was refused or failed (tickets#108)", () => {
    const signedOut = { isLoggedIn: false };
    expect(
      isLoginRefusal(
        failure(401, { success: false, message: "Token has expired" }),
        signedOut,
      ),
    ).toBe(true);
    expect(isLoginRefusal(failure(401, undefined), signedOut)).toBe(true);
  });

  it("is not a 401 without the reason while the person is still signed in", () => {
    const signedIn = { isLoggedIn: true };
    expect(isLoginRefusal(failure(401, undefined), signedIn)).toBe(false);
    expect(
      isLoginRefusal(
        failure(401, { success: false, message: "Token has expired" }),
        signedIn,
      ),
    ).toBe(false);
  });

  it("is not a 401 without the reason when the sign-in state is unknown", () => {
    expect(isLoginRefusal(failure(401, undefined))).toBe(false);
  });

  it("is the reason in an answer without an error status", () => {
    expect(
      isLoginRefusal({
        success: false,
        error: { reason: "checkout.login_required", checkType: "permissions" },
      }),
    ).toBe(true);
  });

  it("is no other refusal", () => {
    expect(
      isLoginRefusal(
        failure(409, {
          success: false,
          error: { reason: "checkout.bookable_unavailable" },
        }),
      ),
    ).toBe(false);
    expect(
      isLoginRefusal(
        failure(403, {
          success: false,
          error: { reason: "checkout.permission_denied" },
        }),
      ),
    ).toBe(false);
    expect(
      isLoginRefusal({
        success: false,
        error: { reason: "checkout.permission_denied" },
      }),
    ).toBe(false);
    expect(isLoginRefusal(failure(502, undefined), { isLoggedIn: false })).toBe(
      false,
    );
    expect(
      isLoginRefusal(
        failure(403, {
          success: false,
          error: { reason: "checkout.permission_denied" },
        }),
        { isLoggedIn: false },
      ),
    ).toBe(false);
    expect(isLoginRefusal(null, { isLoggedIn: false })).toBe(false);
  });
});

/**
 * The pre-check of the permissions follows the same rule as the completion:
 * a 401 asks for a sign-in when it carries the reason or nobody is signed in.
 */
describe("permissionCheckOfFailure", () => {
  const LOGIN_REQUIRED_CHECK = {
    success: false,
    error: { checkType: "permissions", reason: "checkout.login_required" },
  };

  it("passes the backend's own permission refusal on", () => {
    const body = {
      success: false,
      error: { checkType: "permissions", reason: "checkout.permission_denied" },
    };
    expect(
      permissionCheckOfFailure(failure(403, body), { isLoggedIn: true }),
    ).toEqual(body);
  });

  it("asks for a sign-in on a 401 once nobody is signed in", () => {
    expect(
      permissionCheckOfFailure(
        failure(401, { success: false, message: "Token has expired" }),
        { isLoggedIn: false },
      ),
    ).toEqual(LOGIN_REQUIRED_CHECK);
  });

  it("asks for a sign-in on the reason without the permissions check type", () => {
    expect(
      permissionCheckOfFailure(
        failure(401, {
          success: false,
          error: { reason: "checkout.login_required" },
        }),
        { isLoggedIn: true },
      ),
    ).toEqual(LOGIN_REQUIRED_CHECK);
  });

  it("does not ask a person still signed in to sign in on a 401 without the reason", () => {
    expect(
      permissionCheckOfFailure(failure(401, undefined), { isLoggedIn: true }),
    ).toBeNull();
  });

  it("denies the permission on a 403 without a body", () => {
    expect(
      permissionCheckOfFailure(failure(403, undefined), { isLoggedIn: true }),
    ).toEqual({
      success: false,
      error: { checkType: "permissions", reason: "checkout.permission_denied" },
    });
  });

  it("has no answer for any other failure", () => {
    expect(
      permissionCheckOfFailure(failure(502, undefined), { isLoggedIn: false }),
    ).toBeNull();
  });
});
