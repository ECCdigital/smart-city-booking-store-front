import { describe, expect, it } from "vitest";

import {
  parseRetryAfter,
  rateLimitWait,
  retryAfterWait,
} from "~~/shared/utils/retryAfter";

const NOW = Date.parse("2026-09-21T10:00:00Z");

describe("parseRetryAfter", () => {
  it("reads delay seconds", () => {
    expect(parseRetryAfter("120", NOW)).toBe(120);
    expect(parseRetryAfter(" 7 ", NOW)).toBe(7);
    expect(parseRetryAfter(45, NOW)).toBe(45);
    expect(parseRetryAfter("0", NOW)).toBe(0);
  });

  it("reads an HTTP date relative to now, rounded up", () => {
    expect(parseRetryAfter("Mon, 21 Sep 2026 10:02:00 GMT", NOW)).toBe(120);
    expect(parseRetryAfter("Mon, 21 Sep 2026 10:00:00 GMT", NOW - 500)).toBe(1);
  });

  it("answers zero for a date that has passed", () => {
    expect(parseRetryAfter("Mon, 21 Sep 2026 09:00:00 GMT", NOW)).toBe(0);
  });

  it("answers null for anything else", () => {
    expect(parseRetryAfter(undefined, NOW)).toBeNull();
    expect(parseRetryAfter(null, NOW)).toBeNull();
    expect(parseRetryAfter("", NOW)).toBeNull();
    expect(parseRetryAfter("soon", NOW)).toBeNull();
    expect(parseRetryAfter("-5", NOW)).toBeNull();
    expect(parseRetryAfter("1.5", NOW)).toBeNull();
    expect(parseRetryAfter(Number.NaN, NOW)).toBeNull();
  });
});

describe("retryAfterWait", () => {
  it("speaks in seconds below a minute", () => {
    expect(retryAfterWait(1)).toEqual({ unit: "seconds", count: 1 });
    expect(retryAfterWait(59)).toEqual({ unit: "seconds", count: 59 });
  });

  it("speaks in minutes from a minute on, rounded up", () => {
    expect(retryAfterWait(60)).toEqual({ unit: "minutes", count: 1 });
    expect(retryAfterWait(61)).toEqual({ unit: "minutes", count: 2 });
    expect(retryAfterWait(3600)).toEqual({ unit: "minutes", count: 60 });
  });

  it("never promises a wait of zero", () => {
    expect(retryAfterWait(0)).toEqual({ unit: "seconds", count: 1 });
  });
});

describe("rateLimitWait", () => {
  const headers = (value: string) => new Headers({ "Retry-After": value });

  it("is null for an error that is no rate limit", () => {
    expect(rateLimitWait({ statusCode: 401 }, NOW)).toBeNull();
    expect(rateLimitWait(new Error("boom"), NOW)).toBeNull();
    expect(rateLimitWait(undefined, NOW)).toBeNull();
  });

  it("reads the Retry-After header of a 429", () => {
    expect(
      rateLimitWait({ response: { status: 429, headers: headers("90") } }, NOW),
    ).toEqual({ seconds: 90 });
    expect(
      rateLimitWait(
        { statusCode: 429, response: { headers: headers("5") } },
        NOW,
      ),
    ).toEqual({ seconds: 5 });
  });

  it("falls back to the backend body's retryAfterSeconds", () => {
    expect(
      rateLimitWait(
        {
          response: { status: 429 },
          data: {
            code: "too_many_requests",
            params: { retryAfterSeconds: 30 },
          },
        },
        NOW,
      ),
    ).toEqual({ seconds: 30 });
  });

  it("reads the seconds the storefront proxy puts on its error data", () => {
    expect(
      rateLimitWait(
        { statusCode: 429, data: { data: { retryAfterSeconds: 12 } } },
        NOW,
      ),
    ).toEqual({ seconds: 12 });
  });

  it("still reports a rate limit that names no wait", () => {
    expect(rateLimitWait({ status: 429 }, NOW)).toEqual({ seconds: null });
  });
});
