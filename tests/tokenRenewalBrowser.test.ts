import { describe, expect, it, vi } from "vitest";
import {
  LOGIN_REQUIRED,
  USER,
  createBackend,
  createBrowser,
  createStorefront,
  runInBrowser,
} from "./fixtures/tokenWorld";

vi.mock("~~/server/api/utils/logger.js", () => ({
  logger: { warn: () => {}, info: () => {}, error: () => {} },
}));

/**
 * ECCdigital/tickets#108 in the browser: the checkout asks for its permission
 * check while the person's access token has expired.
 */

const { default: meRoute } = await import("~~/server/api/auth/me.get");
const { default: permissionsRoute } = await import(
  "~~/server/api/checkout/[bookableID]/permissions.get.js"
);
const { useAuthStore } = await import("~~/stores/auth.js");
const { useApiClient } = await import("~/composables/useApiClient");
const { useCheckout } = await import("~/composables/api/useCheckout.js");
(globalThis as Record<string, unknown>).useApiClient = useApiClient;

const routes = {
  "/api/auth/me": meRoute,
  "/api/checkout/:bookableID/permissions": permissionsRoute,
};

function loggedInCheckout(backend: ReturnType<typeof createBackend>) {
  const storefront = createStorefront(backend, routes);
  const browser = createBrowser(backend.expiredSession());
  runInBrowser(storefront, browser);
  // The page was rendered while the token was still valid.
  useAuthStore().setAuthPayload({ user: USER, permissions: {}, tokenValid: true });
  return browser;
}

describe("the checkout in the browser with an expired access token", () => {
  it("gets the person's permission check, with the token renewed", async () => {
    const backend = createBackend();
    const browser = loggedInCheckout(backend);

    const check = await useCheckout().fetchCheckoutPermissions("tenant-1", "bookable-1");

    expect(check).toEqual({ success: true });
    expect(useAuthStore().isLoggedIn).toBe(true);
    expect(browser.cookies.get("access-token")).toBe(backend.token("access", 2));
  });

  it("shares one renewal with a session check running at the same time", async () => {
    const backend = createBackend();
    let release!: () => void;
    backend.state.refreshGate = new Promise((resolve) => (release = resolve));
    const browser = loggedInCheckout(backend);

    // The tab regains focus while the checkout loads (shared-session plugin).
    const pending = Promise.all([
      useAuthStore().validateAuth(true),
      useCheckout().fetchCheckoutPermissions("tenant-1", "bookable-1"),
    ]);
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    const [stillLoggedIn, check] = await pending;

    expect(stillLoggedIn).toBe(true);
    expect(check).toEqual({ success: true });
    expect(backend.state.refreshCalls).toBe(1);
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 2));
  });

  it("logs the person out and offers the login when the renewal fails", async () => {
    const backend = createBackend();
    backend.revokeRefreshTokens();
    const browser = loggedInCheckout(backend);

    const check = await useCheckout().fetchCheckoutPermissions("tenant-1", "bookable-1");

    expect(check).toEqual(LOGIN_REQUIRED);
    expect(useAuthStore().isLoggedIn).toBe(false);
    expect(browser.cookies.has("access-token")).toBe(false);
    expect(browser.cookies.has("refresh-token")).toBe(false);
  });
});

describe("the session check in the browser", () => {
  it("ends a session whose expired token has no refresh token", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser({ "access-token": backend.token("access", 0) });
    runInBrowser(storefront, browser);

    expect(await useAuthStore().validateAuth(true)).toBe(false);
    expect(browser.cookies.has("access-token")).toBe(false);
  });

  it("keeps the session when the renewal cannot be answered right now", async () => {
    const backend = createBackend();
    backend.state.refreshUnavailable = true;
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession());
    runInBrowser(storefront, browser);

    expect(await useAuthStore().validateAuth(true)).toBe(false);
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 1));

    backend.state.refreshUnavailable = false;
    expect(await useAuthStore().validateAuth(true)).toBe(true);
  });
});
