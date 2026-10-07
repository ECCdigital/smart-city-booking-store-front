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
 * ECCdigital/tickets#108, BFF routes: when the backend answers 401 to the
 * token a route sent (backend 4.3.1, tickets#109), the route renews the token
 * and asks once more.
 */

const { default: permissionsRoute } = await import(
  "~~/server/api/checkout/[bookableID]/permissions.get.js"
);
const { default: modeRoute } = await import("~~/server/api/catalog/mode.get.js");

const PERMISSIONS = "/api/checkout/bookable-1/permissions?tenantID=tenant-1";
const routes = { "/api/checkout/:bookableID/permissions": permissionsRoute };

function permissionCalls(backend: ReturnType<typeof createBackend>) {
  return backend.state.calls.filter((c) => c.path.includes("/checkout/permissions/"));
}

describe("a BFF route whose token the backend rejects", () => {
  it("renews the token, asks once more and hands the new cookies to the browser", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession());

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer).toMatchObject({ status: 200, body: { success: true } });
    expect(permissionCalls(backend).map((c) => c.token)).toEqual([
      backend.token("access", 0),
      backend.token("access", 2),
    ]);
    expect(browser.cookies.get("access-token")).toBe(backend.token("access", 2));
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 2));
  });
});

describe("a BFF route whose token cannot be renewed", () => {
  it("ends the session and passes the backend's 401 on", async () => {
    const backend = createBackend();
    backend.revokeRefreshTokens();
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession());

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer.status).toBe(401);
    expect(answer.body.data).toEqual({ success: false, message: "Token has expired" });
    expect(browser.cookies.has("access-token")).toBe(false);
    expect(browser.cookies.has("refresh-token")).toBe(false);
    expect(permissionCalls(backend)).toHaveLength(1);
  });

  it("asks the backend exactly once more when the renewed token is refused too", async () => {
    const backend = createBackend();
    backend.state.userGone = true;
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession());

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer.status).toBe(401);
    expect(answer.body.data).toEqual({ success: false, message: "User not found" });
    expect(permissionCalls(backend)).toHaveLength(2);
    expect(backend.state.refreshCalls).toBe(1);
  });
});

describe("calls the browser sends side by side with an expired token", () => {
  it("share one renewal, so the rotated refresh token does not end the session", async () => {
    const backend = createBackend();
    let release!: () => void;
    backend.state.refreshGate = new Promise((resolve) => (release = resolve));
    const storefront = createStorefront(backend, routes);
    // Three tabs or components, each with the same cookies.
    const browsers = [1, 2, 3].map(() => createBrowser(backend.expiredSession()));

    const pending = browsers.map((b) => b.call(storefront, PERMISSIONS));
    await new Promise((resolve) => setTimeout(resolve, 20));
    release();
    const answers = await Promise.all(pending);

    expect(answers.map((a) => a.status)).toEqual([200, 200, 200]);
    expect(backend.state.refreshCalls).toBe(1);
    for (const browser of browsers) {
      expect(browser.cookies.get("access-token")).toBe(backend.token("access", 2));
      expect(browser.cookies.get("refresh-token")).toBe(backend.token("refresh", 2));
    }
  });

  it("lets a call that arrives just after the renewal take its tokens", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes);
    const first = createBrowser(backend.expiredSession());
    const late = createBrowser(backend.expiredSession());

    await first.call(storefront, PERMISSIONS);
    const answer = await late.call(storefront, PERMISSIONS);

    expect(answer).toMatchObject({ status: 200, body: { success: true } });
    expect(backend.state.refreshCalls).toBe(1);
    expect(late.cookies.get("access-token")).toBe(backend.token("access", 2));
  });
});

describe("against backend 4.3.0, which treats an expired token as anonymous", () => {
  it("passes the anonymous answer on as before, without renewing", async () => {
    const backend = createBackend({ rejectsBadTokenOnPublicRoutes: false });
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession());

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer).toMatchObject({ status: 200, body: LOGIN_REQUIRED });
    expect(answer.setCookies).toEqual([]);
    expect(backend.state.refreshCalls).toBe(0);
    expect(permissionCalls(backend)).toHaveLength(1);
  });
});

describe("a visitor without a session", () => {
  it("is asked about anonymously, with no renewal", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser({});

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer).toMatchObject({ status: 200, body: LOGIN_REQUIRED });
    expect(answer.setCookies).toEqual([]);
    expect(backend.state.refreshCalls).toBe(0);
  });
});

describe("an SSO session with an expired token", () => {
  it("renews at Keycloak and asks once more", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, routes);
    const browser = createBrowser(backend.expiredSession("keycloak"));

    const answer = await browser.call(storefront, PERMISSIONS);

    expect(answer).toMatchObject({ status: 200, body: { success: true } });
    expect(backend.state.keycloakRefreshCalls).toBe(1);
    expect(backend.state.refreshCalls).toBe(0);
    expect(browser.cookies.get("access-token")).toBe(backend.token("kc-access", 2));
    expect(browser.cookies.get("refresh-token")).toBe(backend.token("kc-refresh", 2));
    expect(browser.cookies.get("auth-type")).toBe("keycloak");
  });
});

describe("a cached route whose token the backend rejects", () => {
  it("keeps the session cookies out of the cache, so no other visitor gets them", async () => {
    const backend = createBackend();
    const storefront = createStorefront(backend, { "/api/catalog/mode": modeRoute });
    const visitor = createBrowser(backend.expiredSession());
    const next = createBrowser({ "access-token": "someone-else", "refresh-token": "theirs" });

    const first = await visitor.call(storefront, "/api/catalog/mode");
    const second = await next.call(storefront, "/api/catalog/mode");

    expect(first).toMatchObject({ status: 200, body: { mode: "portal" } });
    expect(second).toMatchObject({ status: 200, body: { mode: "portal" } });
    expect(first.setCookies).toEqual([]);
    expect(second.setCookies).toEqual([]);
    expect(backend.state.refreshCalls).toBe(0);
  });
});
