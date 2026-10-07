import * as h3 from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// „Benutzer wechseln“ on /sso/confirm (ECCdigital/tickets#273). The route runs
// on real h3; Nitro's auto-imports are stubbed with it, and $fetch answers
// for the backend and Keycloak.
const KEYCLOAK = "https://sso.example.com/realms/guben/protocol/openid-connect";
const ORIGIN = "https://booking.example.com";

const keycloakCalls: { url: string; body: string }[] = [];
let keycloakLogoutFails = false;

vi.mock("~~/server/api/utils/logger.js", () => ({
  logger: { error: vi.fn() },
}));
vi.stubGlobal(
  "useRuntimeConfig",
  () => ({
    apiBaseUrl: "http://backend",
    userBaseUrl: ORIGIN,
    public: { adminBaseUrl: "" },
  }),
);
vi.stubGlobal(
  "$fetch",
  vi.fn(async (url: string, options?: { body?: string }) => {
    if (url === "http://backend/api/instances/public") {
      return {
        applications: [
          {
            id: "keycloak",
            active: true,
            serverUrl: "https://sso.example.com",
            realm: "guben",
            publicClient: "storefront",
          },
        ],
      };
    }
    keycloakCalls.push({ url, body: String(options?.body ?? "") });
    if (keycloakLogoutFails) throw new Error("Keycloak unreachable");
    return "";
  }),
);
for (const name of [
  "defineEventHandler",
  "getQuery",
  "getCookie",
  "deleteCookie",
  "sendRedirect",
  "getRequestURL",
  "createError",
] as const) {
  vi.stubGlobal(name, h3[name]);
}
const { safeReturnTarget } = await import("~~/server/utils/returnTarget");
vi.stubGlobal("safeReturnTarget", safeReturnTarget);

const { default: changeUser } = await import(
  "~~/server/api/auth/sso/change-user.get"
);

const app = h3.createApp().use("/api/auth/sso/change-user", changeUser);
const handle = h3.toWebHandler(app);

async function switchUser(cookie: string) {
  const response = await handle(
    new Request(
      `${ORIGIN}/api/auth/sso/change-user?redirect=${encodeURIComponent("/checkout/7")}`,
      { headers: { cookie } },
    ),
  );
  return {
    status: response.status,
    location: response.headers.get("location") ?? "",
    cookies: response.headers.getSetCookie(),
  };
}

const PENDING_SIGN_IN_COOKIES =
  "kc-pending-token=access-1; kc-pending-refresh=refresh-1; kc-pending-redirect=%2Fcheckout%2F7";

beforeEach(() => {
  keycloakCalls.length = 0;
  keycloakLogoutFails = false;
});

describe("„Benutzer wechseln“", () => {
  it("ends the Keycloak session in the background, as the sign-out does", async () => {
    await switchUser(PENDING_SIGN_IN_COOKIES);

    expect(keycloakCalls).toHaveLength(1);
    expect(keycloakCalls[0].url).toBe(`${KEYCLOAK}/logout`);
    const form = new URLSearchParams(keycloakCalls[0].body);
    expect(form.get("client_id")).toBe("storefront");
    expect(form.get("refresh_token")).toBe("refresh-1");
  });

  it("then sends the browser to the SSO sign-in, keeping the return target", async () => {
    const { status, location } = await switchUser(PENDING_SIGN_IN_COOKIES);

    expect(status).toBe(302);
    expect(location).toBe(
      `/api/auth/sso/login?redirect=${encodeURIComponent("/checkout/7")}`,
    );
  });

  it("never puts the refresh token in the address", async () => {
    const { location } = await switchUser(PENDING_SIGN_IN_COOKIES);

    expect(location).not.toContain("refresh_token");
    expect(location).not.toContain("refresh-1");
  });

  it("does not pass Keycloak's logout page, which asks „Do you want to log out?“", async () => {
    const { location } = await switchUser(PENDING_SIGN_IN_COOKIES);

    expect(location.startsWith(KEYCLOAK)).toBe(false);
  });

  it("clears the pending SSO cookies", async () => {
    const { cookies } = await switchUser(PENDING_SIGN_IN_COOKIES);

    for (const name of [
      "kc-pending-token",
      "kc-pending-refresh",
      "kc-pending-redirect",
    ]) {
      expect(cookies.some((c) => c.startsWith(`${name}=;`))).toBe(true);
    }
  });

  it("falls back to Keycloak's logout page, without a token, when the background sign-out fails", async () => {
    keycloakLogoutFails = true;

    const { location } = await switchUser(PENDING_SIGN_IN_COOKIES);

    const logout = new URL(location);
    expect(`${logout.origin}${logout.pathname}`).toBe(`${KEYCLOAK}/logout`);
    expect(logout.searchParams.get("client_id")).toBe("storefront");
    expect(logout.searchParams.get("post_logout_redirect_uri")).toBe(
      `${ORIGIN}/api/auth/sso/login?redirect=${encodeURIComponent("/checkout/7")}`,
    );
    expect(logout.searchParams.has("refresh_token")).toBe(false);
  });

  it("falls back to Keycloak's logout page when there is no session to end in the background", async () => {
    const { location } = await switchUser("kc-pending-token=access-1");

    expect(keycloakCalls).toHaveLength(0);
    const logout = new URL(location);
    expect(`${logout.origin}${logout.pathname}`).toBe(`${KEYCLOAK}/logout`);
    expect(logout.searchParams.has("refresh_token")).toBe(false);
  });
});
