import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * The Nitro side of a guest's signed link: the BFF
 * reads tenant and booking off the token to build the backend path, hands
 * the token on in `X-Customer-Upload-Link` and never sends the session's
 * token - a stale cookie must not stand in the way of a guest. A token it
 * cannot read it refuses before the backend; the backend's refusals pass
 * on with their status and body.
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
vi.stubGlobal("$fetch", async () => ({
  customerUploadLimits: { maxFileSizeMb: 1 },
}));

const { forwardByLink, linkRequestOf, linkTargetOf, LINK_HEADER } =
  await import("~~/server/utils/customerUploadLink");
const { forwardCustomerUpload, resetCustomerUploadLimitCache } = await import(
  "~~/server/utils/customerUploadProxy"
);

const linkFor = (tenantId: string, bookingId: string) =>
  `${Buffer.from(JSON.stringify({ t: tenantId, b: bookingId })).toString(
    "base64url",
  )}.c2lnbmF0dXJl`;

const LINK = linkFor("t1", "B1");

function event(body = new Uint8Array(100)) {
  return {
    params: { fieldId: "f1", mediaId: "M1" },
    body: new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(body);
        controller.close();
      },
    }),
    node: { req: { socket: { remoteAddress: "203.0.113.7" } } },
  };
}

async function thrown(promise: Promise<unknown>) {
  try {
    await promise;
  } catch (err) {
    return err as { statusCode: number; data: { code?: string } };
  }
  throw new Error("the route answered instead of refusing");
}

describe("the link of a guest", () => {
  beforeEach(() => {
    resetCustomerUploadLimitCache();
    renewAccessToken.mockClear();
    state.headers = { [LINK_HEADER]: LINK };
    // A stale session of someone else in the same browser.
    state.cookies = { "access-token": "h.e30.s" };
    state.responseHeaders = {};
    state.status = 200;
  });

  it("names tenant and booking", () => {
    expect(linkTargetOf(LINK)).toEqual({ tenantId: "t1", bookingId: "B1" });
    expect(linkTargetOf("")).toBeNull();
    expect(linkTargetOf("kein-token")).toBeNull();
    expect(linkTargetOf("a.b.c")).toBeNull();
    expect(
      linkTargetOf(`${Buffer.from("{}").toString("base64url")}.sig`),
    ).toBeNull();
  });

  it("builds the backend path of the booking with the token", () => {
    const request = linkRequestOf(event() as never, "/f1");

    expect(request.path).toBe(
      "/api/v2/t1/bookings/B1/customer-uploads-by-link/f1",
    );
    expect(request.headers).toEqual({ [LINK_HEADER]: LINK });
  });

  it("is refused before the backend when it cannot be read", async () => {
    state.headers = { [LINK_HEADER]: "kaputt" };
    const fetchImpl = vi.fn();

    const error = await thrown(
      forwardByLink(event() as never, "GET", "", fetchImpl as never),
    );

    expect(error.statusCode).toBe(403);
    expect(error.data.code).toBe("customer_upload_link_invalid");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("reads the booking without the session", async () => {
    const answer = { tenant: { id: "t1", name: "Stadt" }, booking: { id: "B1" } };
    const fetchImpl = vi.fn(async () => answer);

    const result = await forwardByLink(
      event() as never,
      "GET",
      "",
      fetchImpl as never,
    );

    expect(result).toEqual(answer);
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [
      string,
      { method: string; headers: Record<string, string> },
    ];
    expect(url).toBe(
      "http://backend.test/api/v2/t1/bookings/B1/customer-uploads-by-link",
    );
    expect(init.method).toBe("GET");
    expect(init.headers[LINK_HEADER]).toBe(LINK);
    expect(init.headers).not.toHaveProperty("Authorization");
    expect(init.headers).not.toHaveProperty("authorization");
  });

  it("passes the backend's refusal of an expired link on", async () => {
    const fetchImpl = vi.fn(async () => {
      throw {
        statusCode: 403,
        statusMessage: "Forbidden",
        data: { code: "customer_upload_link_expired" },
      };
    });

    const error = await thrown(
      forwardByLink(event() as never, "DELETE", "/f1/M1", fetchImpl as never),
    );

    expect(error.statusCode).toBe(403);
    expect(error.data.code).toBe("customer_upload_link_expired");
  });

  it("streams an upload with the token and without the session", async () => {
    state.headers["content-type"] = "multipart/form-data; boundary=x";
    const calls: RequestInit[] = [];
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const reader = (init.body as ReadableStream<Uint8Array>).getReader();
      while (!(await reader.read()).done);
      calls.push(init);
      return new Response(JSON.stringify({ customerUploadState: {} }), {
        status: 201,
      });
    });
    const { path, headers } = linkRequestOf(event() as never, "/f1");

    await forwardCustomerUpload(event() as never, {
      method: "POST",
      path,
      headers,
      requireSignIn: false,
      withSession: false,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    const sent = calls[0].headers as Record<string, string>;
    expect(sent[LINK_HEADER]).toBe(LINK);
    expect(sent).not.toHaveProperty("authorization");
    expect(renewAccessToken).not.toHaveBeenCalled();
    expect(state.status).toBe(201);
  });
});
