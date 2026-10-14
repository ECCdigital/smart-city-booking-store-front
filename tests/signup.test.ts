import * as h3 from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Registration on /api/auth/signup (ECCdigital/tickets#198). The route runs on
// real h3; Nitro's auto-imports are stubbed with it, and $fetch stands in for
// the backend and records what the storefront sends to /auth/signup.
const ORIGIN = "https://booking.example.com";

const backendCalls: { url: string; body: Record<string, unknown> }[] = [];

vi.stubGlobal("useRuntimeConfig", () => ({
  apiBaseUrl: "http://backend/api",
  userBaseUrl: ORIGIN,
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
  "createError",
] as const) {
  vi.stubGlobal(name, h3[name]);
}

const { default: signup } = await import("~~/server/api/auth/signup.post");

const app = h3.createApp().use("/api/auth/signup", signup);
const handle = h3.toWebHandler(app);

async function register(form: Record<string, unknown>) {
  return handle(
    new Request(`${ORIGIN}/api/auth/signup`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    }),
  );
}

const form = {
  firstname: "  Erika ",
  lastname: " Mustermann  ",
  company: "",
  email: "Erika@Example.com",
  password: "secret-1",
  passwordRepeat: "secret-1",
};

describe("signup", () => {
  beforeEach(() => {
    backendCalls.length = 0;
  });

  it("sends first and last name as firstName and lastName to the backend", async () => {
    const response = await register(form);

    expect(response.status).toBe(200);
    expect(backendCalls).toHaveLength(1);
    expect(backendCalls[0]!.url).toBe("http://backend/api/auth/signup");
    expect(backendCalls[0]!.body).toMatchObject({
      id: "erika@example.com",
      firstName: "Erika",
      lastName: "Mustermann",
    });
    expect(backendCalls[0]!.body).not.toHaveProperty("firstname");
    expect(backendCalls[0]!.body).not.toHaveProperty("lastname");
  });
});
