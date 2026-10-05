import { describe, expect, it } from "vitest";

import { proxyErrorOf, upstreamErrorOf } from "~~/server/utils/proxyError";

/**
 * A Nitro proxy passes what the backend answered on to the client: the status
 * code and the error body with its code. A backend that did not answer at all
 * is an error of its own, never a successful empty answer.
 */
describe("the backend error a proxy passes on", () => {
  it("keeps the status code and the error body of the backend", () => {
    const body = {
      error: "NotFoundError",
      code: "offer_not_found",
      statusCode: 404,
      params: { id: "b1" },
    };

    const upstream = upstreamErrorOf({
      statusCode: 404,
      statusMessage: "Not Found",
      data: body,
    });

    expect(proxyErrorOf(upstream, "Failed to fetch bookable")).toEqual({
      statusCode: 404,
      statusMessage: "Failed to fetch bookable",
      data: body,
    });
  });

  it("keeps the structured checkout refusal of a 409", () => {
    const body = {
      success: false,
      error: { reason: "checkout.offer_not_reachable", checkType: "supervision" },
    };

    const upstream = upstreamErrorOf({
      statusCode: 409,
      statusMessage: "Conflict",
      data: body,
    });

    expect(proxyErrorOf(upstream)).toEqual({
      statusCode: 409,
      statusMessage: "Conflict",
      data: body,
    });
  });

  it("answers 502 when the backend did not answer at all", () => {
    // ofetch rejects a refused connection or a timeout without a status.
    const upstream = upstreamErrorOf(new TypeError("fetch failed"));

    expect(upstream.status).toBe(502);
    expect(proxyErrorOf(upstream, "Failed to fetch bookable")).toEqual({
      statusCode: 502,
      statusMessage: "Failed to fetch bookable",
      data: undefined,
    });
  });

  it("keeps a 5xx of the backend a 5xx", () => {
    const upstream = upstreamErrorOf({
      statusCode: 503,
      statusMessage: "Service Unavailable",
    });

    expect(proxyErrorOf(upstream).statusCode).toBe(503);
  });

  it("never turns an error without a usable status into a success", () => {
    expect(proxyErrorOf({ status: 0, message: "" }).statusCode).toBe(502);
    expect(proxyErrorOf({ status: 200, message: "OK" }).statusCode).toBe(502);
  });
});
