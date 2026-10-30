import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import de from "~~/i18n/locales/de.json";
import en from "~~/i18n/locales/en.json";
import {
  addressBlacklistedContact,
  addressBlacklistedMessage,
  addressBlacklistedRefusalOf,
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
      error: { reason: "checkout.bookable_not_found" },
    };

    expect(backendErrorBodyOf(failure(404, body))).toEqual(body);
  });

  it("is null when the backend sent no body", () => {
    expect(backendErrorBodyOf(failure(502, undefined))).toBeNull();
    expect(backendErrorBodyOf(null)).toBeNull();
  });
});

describe("resolveCheckoutFailureKey", () => {
  it("names the refusal of an offer that is withdrawn or whose tenant is not public", () => {
    expect(
      resolveCheckoutFailureKey(
        failure(404, {
          success: false,
          error: { reason: "checkout.bookable_not_found" },
        }),
      ),
    ).toBe("checkout.bookable_not_found");
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
    ).toBe("checkout.bookable_not_found");
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

describe("the wording of an offer that is no longer available", () => {
  const wording = {
    de: "Dieses Angebot ist nicht mehr verfügbar und kann nicht gebucht werden.",
    en: "This offer is no longer available and cannot be booked.",
  };

  const locales = [
    ["de", de],
    ["en", en],
  ];

  it.each(locales)("%s names checkout.bookable_not_found as no longer available", (locale, messages) => {
    expect(messages.checkout.bookable_not_found).toBe(wording[locale]);
  });

  it.each(locales)("%s carries no key for the removed checkout.offer_not_reachable", (_locale, messages) => {
    expect(messages.checkout).not.toHaveProperty("offer_not_reachable");
  });
});

describe("the refusal of an address on the blacklist", () => {
  const translator = (locale) =>
    createI18n({ legacy: false, locale, messages: { de, en } }).global.t;

  it("names the instance's mail address to write to", () => {
    expect(
      addressBlacklistedMessage({ mailAddress: "betrieb@example.test" }, translator("de")),
    ).toBe(
      "Mit dieser Adresse ist keine Buchung möglich. Bei Fragen wende dich per Mail an betrieb@example.test.",
    );
  });

  it("names the operator of the offer where the instance has no mail address", () => {
    const expected =
      "Mit dieser Adresse ist keine Buchung möglich. Bei Fragen wende dich per Mail an den Betreiber dieses Angebots.";

    expect(addressBlacklistedMessage({ mailAddress: "" }, translator("de"))).toBe(expected);
    expect(addressBlacklistedMessage({ mailAddress: "  " }, translator("de"))).toBe(expected);
    expect(addressBlacklistedMessage({}, translator("de"))).toBe(expected);
    expect(addressBlacklistedMessage(undefined, translator("de"))).toBe(expected);
  });

  it("reads the mail address to link and copy, trimmed, empty without one", () => {
    expect(addressBlacklistedContact({ mailAddress: " betrieb@example.test " })).toBe(
      "betrieb@example.test",
    );
    expect(addressBlacklistedContact({ mailAddress: "" })).toBe("");
    expect(addressBlacklistedContact({ mailAddress: 42 })).toBe("");
    expect(addressBlacklistedContact(undefined)).toBe("");
  });

  it("speaks English too", () => {
    expect(
      addressBlacklistedMessage({ mailAddress: "betrieb@example.test" }, translator("en")),
    ).toBe(
      "No booking is possible with this address. If you have questions, please write to betrieb@example.test.",
    );
    expect(addressBlacklistedMessage({}, translator("en"))).toBe(
      "No booking is possible with this address. If you have questions, please write to the operator of this offer.",
    );
  });
});

// The registration answers an address on the blacklist with the checkout's
// refusal; the BFF hands its body on.
describe("addressBlacklistedRefusalOf", () => {
  const refusal = (mailAddress) =>
    failure(409, {
      error: "checkout.address_blacklisted",
      params: { mailAddress },
    });

  it("is the instance's mail address of the refusal, trimmed", () => {
    expect(addressBlacklistedRefusalOf(refusal(" betrieb@example.test "))).toBe(
      "betrieb@example.test",
    );
  });

  it("is empty where the instance has no mail address", () => {
    expect(addressBlacklistedRefusalOf(refusal(""))).toBe("");
    expect(
      addressBlacklistedRefusalOf(
        failure(409, { error: "checkout.address_blacklisted" }),
      ),
    ).toBe("");
  });

  it("is null for any other failure", () => {
    expect(addressBlacklistedRefusalOf(failure(409, {}))).toBeNull();
    expect(
      addressBlacklistedRefusalOf(failure(400, { reason: "secret_mismatch" })),
    ).toBeNull();
    expect(addressBlacklistedRefusalOf(failure(502, undefined))).toBeNull();
    expect(addressBlacklistedRefusalOf(null)).toBeNull();
  });
});
