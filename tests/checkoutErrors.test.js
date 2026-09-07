import { describe, expect, it } from "vitest";

import { resolveCheckoutErrorKey } from "~/utils/checkoutErrors.js";

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
    // A backend without B1 sends the shortage as `checkout.unknown` with the
    // capacity counters in `params`; the storefront keeps the generic reason
    // instead of guessing the cause from `params`.
    expect(
      resolveCheckoutErrorKey({
        reason: "checkout.unknown",
        checkType: null,
        params: { capacity: 2, occupied: 3 },
      }),
    ).toBe("checkout.unknown");
  });
});
