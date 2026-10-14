import { describe, expect, it, vi } from "vitest";
import {
  LOGIN_REQUIRED,
  createBackend,
  createBrowser,
  createStorefront,
} from "./fixtures/tokenWorld";

vi.mock("~~/server/api/utils/logger.js", () => ({
  logger: { warn: () => {}, info: () => {}, error: () => {} },
}));

/**
 * ECCdigital/tickets#108, server rendering: the page checks the session with
 * `/api/auth/me`, which renews an expired access token. The renewed cookies
 * have to reach the browser, and the rest of the render has to use them.
 */

const { default: meRoute } = await import("~~/server/api/auth/me.get");
const { default: permissionsRoute } = await import(
  "~~/server/api/checkout/[bookableID]/permissions.get.js"
);
const { useAuthStore } = await import("~~/stores/auth.js");
const { useApiClient } = await import("~/composables/useApiClient");
(globalThis as Record<string, unknown>).useApiClient = useApiClient;

const routes = {
  "/api/auth/me": meRoute,
  "/api/checkout/:bookableID/permissions": permissionsRoute,
};

/** The checkout page: auth middleware first, then the permission check. */
async function renderCheckout(between: () => void = () => {}) {
  const auth = useAuthStore();
  await auth.validateAuth();
  between();
  const { data, error } = await useApiClient().get(
    "/api/checkout/bookable-1/permissions?tenantID=tenant-1",
  );
  return { loggedIn: auth.isLoggedIn, permissions: data, error: error?.statusCode ?? null };
}


describe("a page rendered on the server with an expired access token", () => {
  it("hands the renewed tokens to the browser", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes, renderCheckout);
    const browser = createBrowser(backend.expiredSession());

    const page = await browser.load(storefront);

    expect(page.body.rendered.loggedIn).toBe(true);
    expect(browser.cookies.get("access-token")).toBe(backend.token("access", 2));
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 2));
  });

  it("sends the renewed token with the later calls of the same render", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes, renderCheckout);
    const browser = createBrowser(backend.expiredSession());

    const page = await browser.load(storefront);

    expect(page.body.rendered.permissions).toEqual({ success: true });
    expect(backend.state.refreshCalls).toBe(1);
    expect(backend.state.calls.at(-1)).toMatchObject({ token: backend.token("access", 2) });
  });
});

describe("a page rendered on the server whose token expires during the render", () => {
  it("hands the token a BFF call renewed to the browser", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes, () =>
      renderCheckout(() => backend.expireAccessTokens()),
    );
    const browser = createBrowser(backend.validSession());

    const page = await browser.load(storefront);

    expect(page.body.rendered.permissions).toEqual({ success: true });
    expect(backend.state.refreshCalls).toBe(1);
    expect(browser.cookies.get("access-token")).toBe(backend.token("access", 2));
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 2));
  });
});

describe("a page rendered on the server whose session cannot be renewed", () => {
  it("renders logged out, offers the login and clears the browser's cookies", async () => {
    const backend = createBackend();
    backend.revokeRefreshTokens();
    const storefront = createStorefront(backend, routes, renderCheckout);
    const browser = createBrowser(backend.expiredSession());

    const page = await browser.load(storefront);

    expect(page.body.rendered.loggedIn).toBe(false);
    // The later call of the render goes out anonymously: login required.
    expect(page.body.rendered.permissions).toEqual(LOGIN_REQUIRED);
    expect(browser.cookies.has("access-token")).toBe(false);
    expect(browser.cookies.has("refresh-token")).toBe(false);
  });
});
