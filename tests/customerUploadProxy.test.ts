import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Nitro route of a customer upload: it streams
 * the multipart body to the backend, refuses a body above the instance limit
 * before the backend is asked, and passes the backend's refusals on with
 * their status, body and `Retry-After`.
 */

const renewAccessToken = vi.fn(async () => "renewed-token");
vi.mock("~~/server/service/AuthService.js", () => ({
  default: { renewAccessToken },
}));

const state = {
  headers: {} as Record<string, string>,
  cookies: {} as Record<string, string>,
  responseHeaders: {} as Record<string, unknown>,
  status: 200,
  instance: { customerUploadLimits: { maxFileSizeMb: 1 } } as unknown,
};

vi.stubGlobal("defineEventHandler", (handler: unknown) => handler);
vi.stubGlobal("useRuntimeConfig", () => ({
  apiBaseUrl: "http://backend.test",
}));
vi.stubGlobal(
  "getRouterParam",
  (event: { params: Record<string, string> }, name: string) =>
    event.params[name],
);
vi.stubGlobal(
  "getRequestHeader",
  (_event: unknown, name: string) => state.headers[name],
);
vi.stubGlobal("getCookie", (_event: unknown, name: string) => state.cookies[name]);
vi.stubGlobal(
  "getRequestWebStream",
  (event: { body: ReadableStream<Uint8Array> }) => event.body,
);
vi.stubGlobal("setResponseHeader", (_event: unknown, name: string, value: unknown) => {
  state.responseHeaders[name] = value;
});
vi.stubGlobal("setResponseStatus", (_event: unknown, status: number) => {
  state.status = status;
});
vi.stubGlobal("createError", (input: { statusMessage?: string }) =>
  Object.assign(new Error(input.statusMessage), input),
);
vi.stubGlobal("$fetch", async () => state.instance);

const {
  checkoutLimit,
  expiresSoon,
  exceedsLimit,
  forwardCustomerUpload,
  resetCustomerUploadLimitCache,
} = await import("~~/server/utils/customerUploadProxy");

const BOUNDARY = "----biletado";
const MULTIPART = `multipart/form-data; boundary=${BOUNDARY}`;

function streamOf(bytes: Uint8Array) {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 16 * 1024) {
        controller.enqueue(bytes.subarray(i, i + 16 * 1024));
      }
      controller.close();
    },
  });
}

function event(body = new Uint8Array(100)) {
  return {
    params: { tenantID: "t1", bookingId: "B1", fieldId: "f1" },
    body: streamOf(body),
    node: { req: { socket: { remoteAddress: "203.0.113.7" } } },
  };
}

const token = (expSeconds: number) =>
  `h.${Buffer.from(JSON.stringify({ exp: expSeconds })).toString("base64url")}.s`;

/** A backend that reads the whole stream, then answers. */
function backend(status: number, body: unknown, headers: Record<string, string> = {}) {
  const calls: { url: string; init: RequestInit; received: number }[] = [];
  const fetchImpl = vi.fn(async (url: string, init: RequestInit) => {
    let received = 0;
    const reader = (init.body as ReadableStream<Uint8Array>).getReader();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      received += value.byteLength;
    }
    calls.push({ url, init, received });
    return new Response(JSON.stringify(body), { status, headers });
  });
  return { fetchImpl: fetchImpl as unknown as typeof fetch, calls };
}

async function thrown(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    return err as { statusCode: number; data: { code?: string } };
  }
  throw new Error("the route answered instead of refusing");
}

const PATH = "/api/v2/t1/bookings/B1/customer-uploads/f1";

describe("the customer upload route", () => {
  beforeEach(() => {
    resetCustomerUploadLimitCache();
    renewAccessToken.mockClear();
    state.headers = { "content-type": MULTIPART };
    state.cookies = { "access-token": token(Date.now() / 1000 + 3600) };
    state.responseHeaders = {};
    state.status = 200;
    state.instance = { customerUploadLimits: { maxFileSizeMb: 1 } };
  });

  it("streams the body to the backend with the token and answers its state", async () => {
    const answer = { customerUploadState: { state: "toReview", fields: [] } };
    const { fetchImpl, calls } = backend(201, answer);

    const result = await forwardCustomerUpload(event(new Uint8Array(50_000)) as never, {
      method: "POST",
      path: PATH,
      fetchImpl,
    });

    expect(result).toEqual(answer);
    expect(state.status).toBe(201);
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe(`http://backend.test${PATH}`);
    expect(calls[0].received).toBe(50_000);
    expect(calls[0].init.method).toBe("POST");
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers["content-type"]).toBe(MULTIPART);
    expect(headers.authorization).toMatch(/^Bearer /);
    expect(headers["X-Forwarded-For"]).toBe("203.0.113.7");
    expect(renewAccessToken).not.toHaveBeenCalled();
  });

  it("refuses a body announced above the instance limit before the backend is asked", async () => {
    state.headers["content-length"] = String(2 * 1024 * 1024);
    const { fetchImpl } = backend(201, {});

    const err = await thrown(
      forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl }),
    );

    expect(err.statusCode).toBe(400);
    expect(err.data.code).toBe("customer_upload_too_large");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("cuts a body off past the limit when no length was announced", async () => {
    const { fetchImpl } = backend(201, {});

    const err = await thrown(
      forwardCustomerUpload(event(new Uint8Array(2 * 1024 * 1024)) as never, {
        method: "POST",
        path: PATH,
        fetchImpl,
      }),
    );

    expect(err.statusCode).toBe(400);
    expect(err.data.code).toBe("customer_upload_too_large");
  });

  it("refuses a body that is no multipart", async () => {
    state.headers["content-type"] = "application/json";
    const { fetchImpl } = backend(201, {});

    const err = await thrown(
      forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl }),
    );

    expect(err.statusCode).toBe(400);
    expect(err.data.code).toBe("customer_upload_file_missing");
  });

  it("answers 401 without a session", async () => {
    state.cookies = {};
    const { fetchImpl } = backend(201, {});

    const err = await thrown(
      forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl }),
    );

    expect(err.statusCode).toBe(401);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("renews a token about to expire before the stream starts", async () => {
    state.cookies = { "access-token": token(Date.now() / 1000 + 5) };
    const { fetchImpl, calls } = backend(201, {});

    await forwardCustomerUpload(event() as never, { method: "PUT", path: PATH, fetchImpl });

    expect(renewAccessToken).toHaveBeenCalledOnce();
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer renewed-token");
  });

  it("passes the backend's refusal on with its status and body", async () => {
    const refusal = {
      error: "BadRequestError",
      code: "customer_upload_virus_found",
      statusCode: 400,
      params: {},
    };
    const { fetchImpl } = backend(400, refusal);

    const err = await thrown(
      forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl }),
    );

    expect(err.statusCode).toBe(400);
    expect(err.data).toEqual(refusal);
  });

  it("passes a 429 on with its Retry-After", async () => {
    const { fetchImpl } = backend(
      429,
      { code: "customer_upload_rate_limited", params: { retryAfterSeconds: 42 } },
      { "retry-after": "42" },
    );

    const err = await thrown(
      forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl }),
    );

    expect(err.statusCode).toBe(429);
    expect(err.data.code).toBe("customer_upload_rate_limited");
    expect(state.responseHeaders["Retry-After"]).toBe("42");
  });

  it("falls back to 10 MB when the backend names no limit", async () => {
    state.instance = {};
    expect(exceedsLimit(String(9 * 1024 * 1024), 10)).toBe(false);
    state.headers["content-length"] = String(9 * 1024 * 1024);
    const { fetchImpl } = backend(201, {});

    await forwardCustomerUpload(event() as never, { method: "POST", path: PATH, fetchImpl });

    expect(fetchImpl).toHaveBeenCalledOnce();
  });
});

describe("the checkout with files (ECCdigital/tickets#827)", () => {
  const query: { value: Record<string, unknown> } = { value: {} };
  vi.stubGlobal("getQuery", () => query.value);

  beforeEach(() => {
    resetCustomerUploadLimitCache();
    renewAccessToken.mockClear();
    state.headers = { "content-type": MULTIPART };
    state.cookies = {};
    state.status = 200;
    state.instance = {
      customerUploadLimits: { maxFileSizeMb: 1, maxTotalSizeMbPerBooking: 3 },
    };
    query.value = { tenantID: "t1" };
  });

  async function route() {
    return (await import("~~/server/api/checkout/complete-with-uploads.post"))
      .default as unknown as (event: unknown) => Promise<unknown>;
  }

  it("streams a guest's checkout to the backend's checkout, without a token, and answers it", async () => {
    const answer = { success: true, data: { booking: { id: "B1" }, payment: null } };
    const { fetchImpl, calls } = backend(200, answer);
    vi.stubGlobal("fetch", fetchImpl);

    const result = await (await route())(event(new Uint8Array(2 * 1024 * 1024)));

    expect(result).toEqual(answer);
    expect(calls[0].url).toBe("http://backend.test/api/v2/t1/checkout?simulate=false");
    expect(calls[0].received).toBe(2 * 1024 * 1024);
    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toBeUndefined();
  });

  it("sends the token of a signed-in customer", async () => {
    state.cookies = { "access-token": token(Date.now() / 1000 + 3600) };
    const { fetchImpl, calls } = backend(200, { success: true });

    await forwardCustomerUpload(event() as never, {
      method: "POST",
      path: "/api/v2/t1/checkout",
      requireSignIn: false,
      bodyLimit: checkoutLimit,
      fetchImpl,
    });

    const headers = calls[0].init.headers as Record<string, string>;
    expect(headers.authorization).toMatch(/^Bearer /);
  });

  it("refuses a body above the limit of a booking's files before the backend is asked", async () => {
    state.headers["content-length"] = String(4 * 1024 * 1024);
    const { fetchImpl } = backend(200, {});

    const err = await thrown(
      forwardCustomerUpload(event() as never, {
        method: "POST",
        path: "/api/v2/t1/checkout",
        requireSignIn: false,
        bodyLimit: checkoutLimit,
        fetchImpl,
      }),
    );

    expect(err.statusCode).toBe(400);
    expect(err.data.code).toBe("customer_upload_booking_limit");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("passes the backend's refusal of the checkout on as it is", async () => {
    const refusal = {
      success: false,
      error: {
        reason: "checkout.customer_upload_refused",
        checkType: null,
        params: { code: "customer_upload_virus_found", fieldId: "f1" },
      },
    };
    const { fetchImpl } = backend(200, refusal);

    const result = await forwardCustomerUpload(event() as never, {
      method: "POST",
      path: "/api/v2/t1/checkout",
      requireSignIn: false,
      bodyLimit: checkoutLimit,
      fetchImpl,
    });

    expect(result).toEqual(refusal);
  });

  it("needs the tenant", async () => {
    query.value = {};

    const handler = await route();
    const err = await thrown(Promise.resolve().then(() => handler(event())));

    expect(err.statusCode).toBe(400);
  });
});

describe("the series checkout with files (ECCdigital/tickets#833)", () => {
  const query: { value: Record<string, unknown> } = { value: {} };

  beforeEach(() => {
    // Stubbed here, not at collection: the checkout's tests above keep theirs.
    vi.stubGlobal("getQuery", () => query.value);
    resetCustomerUploadLimitCache();
    state.headers = { "content-type": MULTIPART };
    state.cookies = {};
    state.status = 200;
    state.instance = {
      customerUploadLimits: { maxFileSizeMb: 1, maxTotalSizeMbPerBooking: 3 },
    };
    query.value = { tenantID: "t1" };
  });

  async function route() {
    return (
      await import("~~/server/api/checkout/group-complete-with-uploads.post")
    ).default as unknown as (event: unknown) => Promise<unknown>;
  }

  it("streams the series to the backend's group checkout and answers it", async () => {
    const answer = { success: true, data: { groupBooking: { id: "G-1" } } };
    const { fetchImpl, calls } = backend(200, answer);
    vi.stubGlobal("fetch", fetchImpl);

    const result = await (await route())(event(new Uint8Array(1024)));

    expect(result).toEqual(answer);
    expect(calls[0].url).toBe(
      "http://backend.test/api/v2/t1/checkout/group?simulate=false",
    );
    expect(calls[0].received).toBe(1024);
  });

  it("refuses a body above the limit before the backend is asked", async () => {
    state.headers["content-length"] = String(4 * 1024 * 1024);
    const { fetchImpl } = backend(200, {});
    vi.stubGlobal("fetch", fetchImpl);

    const err = await thrown(
      Promise.resolve().then(async () => (await route())(event())),
    );

    expect(err.data.code).toBe("customer_upload_booking_limit");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("needs the tenant", async () => {
    query.value = {};

    const handler = await route();
    const err = await thrown(Promise.resolve().then(() => handler(event())));

    expect(err.statusCode).toBe(400);
  });
});

describe("expiresSoon", () => {
  it("reads the expiry off the token and leaves an unreadable one alone", () => {
    const now = 1_000_000_000_000;
    expect(expiresSoon(token(now / 1000 + 10), now)).toBe(true);
    expect(expiresSoon(token(now / 1000 + 3600), now)).toBe(false);
    expect(expiresSoon("not-a-jwt", now)).toBe(false);
  });
});
