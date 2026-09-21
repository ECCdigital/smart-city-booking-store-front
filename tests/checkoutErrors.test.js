import { describe, expect, it } from "vitest";

import {
  backendErrorBodyOf,
  resolveCheckoutErrorKey,
  resolveCheckoutFailureKey,
} from "~/utils/checkoutErrors.js";

/**
 * A failed request reaches the page as the BFF's error: the status code and,
 * under `data`, the Nitro error envelope whose own `data` is the backend's
 * error body.
 */
const failure = (statusCode, body) => ({
  statusCode,
  data: { statusCode, statusMessage: "", data: body },
});

describe("backendErrorBodyOf", () => {
  it("finds the backend's error body inside the BFF's error envelope", () => {
    const body = {
      success: false,
      error: { reason: "checkout.offer_not_reachable" },
    };

    expect(backendErrorBodyOf(failure(409, body))).toEqual(body);
  });

  it("is null when the backend sent no body", () => {
    expect(backendErrorBodyOf(failure(502, undefined))).toBeNull();
    expect(backendErrorBodyOf(null)).toBeNull();
  });
});

describe("resolveCheckoutFailureKey", () => {
  it("names the refusal of a withdrawn or blocked offer", () => {
    expect(
      resolveCheckoutFailureKey(
        failure(409, {
          success: false,
          error: { reason: "checkout.offer_not_reachable" },
        }),
      ),
    ).toBe("checkout.offer_not_reachable");
  });

  it("treats a 404 of the backend as an offer that is no longer available", () => {
    expect(
      resolveCheckoutFailureKey(
        failure(404, {
          error: "NotFoundError",
          code: "tenant_not_found",
          statusCode: 404,
        }),
      ),
    ).toBe("checkout.offer_not_reachable");
  });

  it("keeps another structured reason of the backend", () => {
    expect(
      resolveCheckoutFailureKey(
        failure(409, {
          success: false,
          error: { reason: "checkout.payment_provider_unavailable" },
        }),
      ),
    ).toBe("checkout.payment_provider_unavailable");
  });

  it("names nothing for an infrastructure error", () => {
    expect(resolveCheckoutFailureKey(failure(502, undefined))).toBeNull();
    expect(
      resolveCheckoutFailureKey(failure(500, { code: "internal_error" })),
    ).toBeNull();
  });
});

describe("resolveCheckoutErrorKey", () => {
  it("passes the compartment shortage reason through as the i18n key", () => {
    expect(
      resolveCheckoutErrorKey({
        reason: "checkout.compartments_unavailable",
        checkType: null,
        params: { bookableId: "b1", capacity: 2, occupied: 2 },
      }),
    ).toBe("checkout.compartments_unavailable");
  });

  it("does not read a compartment shortage off `params` behind a generic reason", () => {
    // A backend that does not yet name the shortage sends it as
    // `checkout.unknown` with the capacity counters in `params`; the
    // storefront keeps the generic reason instead of guessing the cause
    // from `params`.
    expect(
      resolveCheckoutErrorKey({
        reason: "checkout.unknown",
        checkType: null,
        params: { capacity: 2, occupied: 3 },
      }),
    ).toBe("checkout.unknown");
  });
});
