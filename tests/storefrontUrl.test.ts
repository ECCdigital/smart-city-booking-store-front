import { describe, expect, it } from "vitest";

import { storefrontUrl } from "~~/shared/utils/storefrontUrl";

// Links in auth mails are the storefront's base URL plus a page path
// (ECCdigital/tickets#554). A base URL ending in "/" must not double the slash:
// "//password/reset" opens the start page instead of the reset page.
describe("storefrontUrl", () => {
  it("joins a base URL without a trailing slash and a path", () => {
    expect(
      storefrontUrl("https://booking.example.com", "/password/reset"),
    ).toBe("https://booking.example.com/password/reset");
  });

  it("drops the trailing slash of the base URL", () => {
    expect(
      storefrontUrl("https://ibus.smart-city-booking.de/", "/password/reset"),
    ).toBe("https://ibus.smart-city-booking.de/password/reset");
    expect(
      storefrontUrl("https://booking.example.com//", "/card/link"),
    ).toBe("https://booking.example.com/card/link");
  });

  it("keeps a language prefix in the path", () => {
    expect(
      storefrontUrl("https://booking.example.com/", "/en/password/reset"),
    ).toBe("https://booking.example.com/en/password/reset");
  });

  it("keeps a base path", () => {
    expect(
      storefrontUrl("https://example.com/booking/", "/register/email-verify"),
    ).toBe("https://example.com/booking/register/email-verify");
  });

  it("ignores whitespace around the base URL", () => {
    expect(
      storefrontUrl(" https://booking.example.com/ ", "/password/reset"),
    ).toBe("https://booking.example.com/password/reset");
  });

  it("answers the bare path when no base URL is configured", () => {
    expect(storefrontUrl("", "/password/reset")).toBe("/password/reset");
    expect(storefrontUrl(undefined, "/password/reset")).toBe(
      "/password/reset",
    );
  });
});
