import * as h3 from "h3";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The search's period request on /api/bookables/:tenantID/period-occupancy
// (ECCdigital/tickets#1254). The backend limits it per client IP, counted in
// bookables. The route runs on real h3 with the real `serverFetch`; `$fetch`
// stands in for the backend and records what the storefront sends.

vi.mock("~~/server/api/utils/logger.js", () => ({
  logger: { warn: () => {}, info: () => {}, error: () => {} },
}));

type BackendCall = { url: string; headers: Record<string, string> };
const backendCalls: BackendCall[] = [];
const backend: { refusal: unknown } = { refusal: null };

vi.stubGlobal("useRuntimeConfig", () => ({ apiBaseUrl: "http://backend" }));
vi.stubGlobal(
  "$fetch",
  vi.fn(async (url: string, options: { headers?: Record<string, string> }) => {
    backendCalls.push({ url, headers: { ...options.headers } });
    if (backend.refusal) throw backend.refusal;
    return [{ bookableId: "room-1", isAvailable: true, price: null }];
  }),
);
for (const name of [
  "defineEventHandler",
  "readBody",
  "getRouterParam",
  "getRequestHeader",
  "getCookie",
  "setResponseHeader",
  "createError",
] as const) {
  vi.stubGlobal(name, h3[name]);
}

const { default: periodOccupancy } =
  await import("~~/server/api/bookables/[tenantID]/period-occupancy.post.js");

const app = h3.createApp();
const router = h3.createRouter();
router.post("/api/bookables/:tenantID/period-occupancy", periodOccupancy);
app.use(router);
const handle = h3.toWebHandler(app);

async function askPeriod(headers: Record<string, string> = {}) {
  return handle(
    new Request(
      "https://booking.example.com/api/bookables/tenant-1/period-occupancy",
      {
        method: "POST",
        headers: { "content-type": "application/json", ...headers },
        body: JSON.stringify({
          bookableIds: ["room-1"],
          start: "2026-11-20T10:00:00.000Z",
          end: "2026-11-20T12:00:00.000Z",
        }),
      },
    ),
  );
}

describe("the period occupancy proxy", () => {
  beforeEach(() => {
    backendCalls.length = 0;
    backend.refusal = null;
  });

  it("asks the backend in the visitor's name: their address in X-Forwarded-For", async () => {
    const response = await askPeriod({ "x-forwarded-for": "203.0.113.7" });

    expect(response.status).toBe(200);
    expect(backendCalls).toHaveLength(1);
    expect(backendCalls[0]!.url).toBe(
      "http://backend/api/tenant-1/bookables/occupancy",
    );
    expect(backendCalls[0]!.headers["X-Forwarded-For"]).toBe("203.0.113.7");
  });

  it("hands the backend's 429 on with Retry-After", async () => {
    // A rejected `$fetch`: the backend's status and its error body.
    backend.refusal = {
      statusCode: 429,
      statusMessage: "Too Many Requests",
      data: {
        code: "too_many_requests",
        statusCode: 429,
        params: { retryAfterSeconds: 120 },
      },
    };

    const response = await askPeriod({ "x-forwarded-for": "203.0.113.7" });

    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    expect((await response.json()).data).toEqual({ retryAfterSeconds: 120 });
  });

  it("passes any other refusal on with the backend's status and body", async () => {
    backend.refusal = {
      statusCode: 404,
      statusMessage: "Not Found",
      data: { code: "tenant_not_found", statusCode: 404, params: {} },
    };

    const response = await askPeriod();

    expect(response.status).toBe(404);
    expect(response.headers.get("retry-after")).toBeNull();
    expect((await response.json()).data).toMatchObject({
      code: "tenant_not_found",
    });
  });
});
