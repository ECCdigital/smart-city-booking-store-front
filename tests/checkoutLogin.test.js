import { describe, expect, it } from "vitest";

import {
  checkoutAuthOffer,
  checkoutRequiresLogin,
  isLoginRefusal,
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

describe("checkoutAuthOffer", () => {
  it("offers a validly signed-in person no guest booking for an offer behind a login", () => {
    const requiresLogin = checkoutRequiresLogin({
      permissionCheck: PRE_CHECK_PASSED,
      bookables: [loginRoom],
    });

    expect(checkoutAuthOffer({ isLoggedIn: true, requiresLogin })).toBeNull();
  });

  it("keeps the guest booking for a signed-in person where no login is required", () => {
    const requiresLogin = checkoutRequiresLogin({
      permissionCheck: PRE_CHECK_PASSED,
      bookables: [room],
    });

    expect(checkoutAuthOffer({ isLoggedIn: true, requiresLogin })).toBe(
      "guest",
    );
  });

  it("offers the sign-in to a person who is not signed in, with or without a login requirement", () => {
    expect(checkoutAuthOffer({ isLoggedIn: false, requiresLogin: true })).toBe(
      "login",
    );
    expect(checkoutAuthOffer({ isLoggedIn: false, requiresLogin: false })).toBe(
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

  it("is any 401, whose session the backend did not accept", () => {
    expect(isLoginRefusal(failure(401, undefined))).toBe(true);
    expect(
      isLoginRefusal(failure(401, { success: false, message: "Token has expired" })),
    ).toBe(true);
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
    expect(isLoginRefusal(failure(502, undefined))).toBe(false);
    expect(isLoginRefusal(null)).toBe(false);
  });
});
