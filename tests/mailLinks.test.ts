import * as h3 from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Links the backend puts into auth mails (ECCdigital/tickets#554). The
// storefront names its pages from NUXT_USER_BASE_URL; on ibus that ends in
// "/", and a doubled slash sent the reset link to the start page. The routes
// run on real h3; $fetch stands in for the backend and records what it gets.
const BASE_URL = "https://ibus.smart-city-booking.de/";

const backendCalls: { url: string; body: Record<string, unknown> }[] = [];

vi.stubGlobal("useRuntimeConfig", () => ({
  apiBaseUrl: "http://backend/api",
  userBaseUrl: BASE_URL,
  public: { adminBaseUrl: "" },
}));
vi.stubGlobal(
  "$fetch",
  vi.fn(async (url: string, options: { body: Record<string, unknown> }) => {
    backendCalls.push({ url, body: options.body });
    return {};
  }),
);
for (const name of [
  "defineEventHandler",
  "readBody",
  "getRequestHeader",
  "setResponseHeader",
  "setResponseStatus",
  "createError",
] as const) {
  vi.stubGlobal(name, h3[name]);
}

const routes = {
  "/api/auth/forgot-password": (
    await import("~~/server/api/auth/forgot-password.post")
  ).default,
  "/api/auth/signup": (await import("~~/server/api/auth/signup.post")).default,
  "/api/auth/resend-verification": (
    await import("~~/server/api/auth/resend-verification.post")
  ).default,
  "/api/auth/card/signup": (
    await import("~~/server/api/auth/card/signup.post")
  ).default,
};

const app = h3.createApp();
for (const [path, handler] of Object.entries(routes)) {
  app.use(path, handler);
}
const handle = h3.toWebHandler(app);

async function post(path: keyof typeof routes, body: Record<string, unknown>) {
  const response = await handle(
    new Request(`https://ibus.smart-city-booking.de${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
  expect(response.status).toBeLessThan(300);
  expect(backendCalls).toHaveLength(1);
  return backendCalls[0]!.body;
}

describe("mail links with a base URL ending in a slash", () => {
  beforeEach(() => {
    backendCalls.length = 0;
  });

  it("forgot password falls back to the reset page without a doubled slash", async () => {
    const body = await post("/api/auth/forgot-password", {
      email: "erika@example.com",
    });

    expect(body.resetUrl).toBe(
      "https://ibus.smart-city-booking.de/password/reset",
    );
  });

  it("signup links the verify page without a doubled slash", async () => {
    const body = await post("/api/auth/signup", {
      firstname: "Erika",
      lastname: "Mustermann",
      company: "",
      email: "erika@example.com",
      password: "secret-1",
      passwordRepeat: "secret-1",
    });

    expect(body.verifyUrl).toBe(
      "https://ibus.smart-city-booking.de/register/email-verify",
    );
  });

  it("resending the verification links the verify page without a doubled slash", async () => {
    const body = await post("/api/auth/resend-verification", {
      email: "erika@example.com",
    });

    expect(body.verifyUrl).toBe(
      "https://ibus.smart-city-booking.de/register/email-verify",
    );
  });

  it("card signup links the verify and card link pages without a doubled slash", async () => {
    const body = await post("/api/auth/card/signup", {
      appId: "app",
      publicId: "card-1",
      secret: "secret",
      email: "erika@example.com",
    });

    expect(body.verifyUrl).toBe(
      "https://ibus.smart-city-booking.de/register/email-verify",
    );
    expect(body.linkUrl).toBe("https://ibus.smart-city-booking.de/card/link");
  });
});
