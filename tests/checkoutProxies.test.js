import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The checkout's Nitro proxies pass the backend's refusal on with its status
 * and body (ECCdigital/tickets#107): an offer behind a login reaches the page
 * as the backend's 401, not as an empty `204`, and the completion's 401
 * `checkout.login_required` (tickets#123) as well.
 */

const upstream = { answer: null };
vi.mock("~~/server/api/utils/serverFetch.ts", () => ({
  serverFetch: vi.fn(async () => upstream.answer),
}));

vi.stubGlobal("defineEventHandler", (handler) => handler);
vi.stubGlobal("getRouterParam", (event, name) => event.params[name]);
vi.stubGlobal("getQuery", (event) => event.query);
vi.stubGlobal("readBody", async (event) => event.body);
vi.stubGlobal("createError", (input) =>
  Object.assign(new Error(input.statusMessage), input),
);

const { default: permissionsRoute } = await import(
  "~~/server/api/checkout/[bookableID]/permissions.get.js"
);
const { default: bookableRoute } = await import(
  "~~/server/api/checkout/[bookableID]/index.get.js"
);
const { default: completeRoute } = await import(
  "~~/server/api/checkout/complete.post.js"
);
const { default: groupCompleteRoute } = await import(
  "~~/server/api/checkout/group-complete.post.js"
);

const event = {
  params: { bookableID: "login-room" },
  query: { tenantID: "tenant-1" },
  body: {
    tenantID: "tenant-1",
    bookableItems: [{ bookableId: "login-room", amount: 1 }],
    bookingAttempts: [{ timeBegin: 1, timeEnd: 2 }],
  },
};

const LOGIN_REFUSAL = {
  success: false,
  error: {
    reason: "checkout.login_required",
    checkType: "permissions",
    params: {},
  },
};

function refusedWith(status, data) {
  upstream.answer = {
    data: null,
    error: { status, message: "Refused", data },
  };
}

async function thrownBy(route) {
  try {
    await route(event);
  } catch (err) {
    return err;
  }
  throw new Error("the route answered instead of passing the refusal on");
}

describe("the checkout proxies", () => {
  beforeEach(() => {
    upstream.answer = null;
  });

  it("pass the completion's 401 with checkout.login_required on, single and group", async () => {
    for (const route of [completeRoute, groupCompleteRoute]) {
      refusedWith(401, LOGIN_REFUSAL);

      const err = await thrownBy(route);

      expect(err.statusCode).toBe(401);
      expect(err.data).toEqual(LOGIN_REFUSAL);
    }
  });

  it("pass a 401 and a 403 of the pre-check on with their body", async () => {
    const unauthorized = { success: false, message: "Unauthorized" };
    refusedWith(401, unauthorized);
    const err401 = await thrownBy(permissionsRoute);
    expect(err401.statusCode).toBe(401);
    expect(err401.data).toEqual(unauthorized);

    const forbidden = {
      success: false,
      error: { reason: "checkout.permission_denied", checkType: "permissions" },
    };
    refusedWith(403, forbidden);
    const err403 = await thrownBy(permissionsRoute);
    expect(err403.statusCode).toBe(403);
    expect(err403.data).toEqual(forbidden);
  });

  it("pass the pre-check's answer on as it is", async () => {
    upstream.answer = { data: LOGIN_REFUSAL, error: null };

    expect(await permissionsRoute(event)).toEqual(LOGIN_REFUSAL);
  });

  it("pass a refusal of the offer on instead of an empty answer", async () => {
    const notFound = { error: "NotFoundError", code: "tenant_not_found" };
    refusedWith(404, notFound);
    const err404 = await thrownBy(bookableRoute);
    expect(err404.statusCode).toBe(404);
    expect(err404.data).toEqual(notFound);

    refusedWith(401, { success: false, message: "Token has expired" });
    expect((await thrownBy(bookableRoute)).statusCode).toBe(401);
  });

  it("deliver the offer with its login requirement", async () => {
    const offer = { id: "login-room", requiresLogin: true };
    upstream.answer = { data: offer, error: null };

    expect(await bookableRoute(event)).toEqual(offer);
  });
});
