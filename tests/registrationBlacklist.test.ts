import * as h3 from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addressBlacklistedRefusalOf } from "~/utils/checkoutErrors.js";

// The registration refuses an address on the blacklist:
// the backend answers 409 with the checkout's reason and the instance's mail
// address. Each registration route - password, SSO, card - hands that body on
// to the page. The routes run on real h3; Nitro's auto-imports are stubbed with
// it, and $fetch stands in for the backend.
const ORIGIN = "https://booking.example.com";
const REFUSAL = {
  error: "checkout.address_blacklisted",
  params: { mailAddress: "betrieb@example.test" },
};

/** A `$fetch` the backend refused, as ofetch rejects it. */
function rejected(status: number, data: unknown) {
  return Object.assign(new Error(`[POST] ${status}`), {
    status,
    statusCode: status,
    statusText: "Conflict",
    statusMessage: "Conflict",
    data,
    response: { status, statusText: "Conflict", _data: data },
  });
}

const backend = vi.fn();

vi.stubGlobal("useRuntimeConfig", () => ({
  apiBaseUrl: "http://backend/api",
  userBaseUrl: ORIGIN,
  public: { adminBaseUrl: "" },
}));
vi.stubGlobal("$fetch", backend);
for (const name of [
  "defineEventHandler",
  "readBody",
  "getRequestHeader",
  "setResponseHeader",
  "createError",
  "getCookie",
  "setCookie",
  "deleteCookie",
] as const) {
  vi.stubGlobal(name, h3[name]);
}

const { default: signup } = await import("~~/server/api/auth/signup.post");
const { default: ssoRegister } = await import(
  "~~/server/api/auth/sso/register.post"
);
const { default: cardSignup } = await import(
  "~~/server/api/auth/card/signup.post"
);

const app = h3
  .createApp()
  .use("/api/auth/signup", signup)
  .use("/api/auth/sso/register", ssoRegister)
  .use("/api/auth/card/signup", cardSignup);
const handle = h3.toWebHandler(app);

function post(path: string, body: unknown, cookie?: string) {
  return handle(
    new Request(`${ORIGIN}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(cookie ? { cookie } : {}),
      },
      body: JSON.stringify(body),
    }),
  );
}

/** What the page's `$fetch` rejects with: the status and the error JSON. */
async function asPageSees(response: Response) {
  return { statusCode: response.status, data: await response.json() };
}

const ROUTES = [
  [
    "by password",
    () =>
      post("/api/auth/signup", {
        firstname: "Erika",
        lastname: "Muster",
        company: "",
        email: "spam@example.test",
        password: "secret-1",
        passwordRepeat: "secret-1",
      }),
  ],
  [
    "by SSO",
    () => post("/api/auth/sso/register", {}, "kc-pending-token=kc-token"),
  ],
  [
    "by card",
    () =>
      post("/api/auth/card/signup", {
        appId: "library-card",
        publicId: "4711",
        secret: "1234",
        email: "spam@example.test",
      }),
  ],
] as const;

describe("the registration of an address on the blacklist", () => {
  beforeEach(() => {
    backend.mockReset();
  });

  it.each(ROUTES)(
    "%s hands the refusal with the instance's mail address on",
    async (_, register) => {
      backend.mockRejectedValue(rejected(409, REFUSAL));

      const response = await register();

      expect(response.status).toBe(409);
      expect(addressBlacklistedRefusalOf(await asPageSees(response))).toBe(
        "betrieb@example.test",
      );
    },
  );

  it.each(ROUTES)(
    "%s hands an empty mail address on where the instance has none",
    async (_, register) => {
      backend.mockRejectedValue(
        rejected(409, { ...REFUSAL, params: { mailAddress: "" } }),
      );

      const response = await register();

      expect(addressBlacklistedRefusalOf(await asPageSees(response))).toBe("");
    },
  );
});

describe("the card registration's other refusals", () => {
  it("keeps the reason the card login names", async () => {
    backend.mockRejectedValue(
      rejected(401, { message: "Card verification failed", reason: "expired" }),
    );

    const response = await ROUTES[2][1]();
    const { data } = await asPageSees(response);

    expect(response.status).toBe(401);
    expect(data.data.reason).toBe("expired");
  });
});
