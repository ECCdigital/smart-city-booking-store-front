/**
 * The wait a rate-limited backend names: `429` with a `Retry-After` header
 * (delay seconds or an HTTP date, RFC 9110 §10.2.3) and, in the body,
 * `params.retryAfterSeconds`. Shared by the Nitro proxies, which hand the
 * status and header on, and the pages, which show "try again in X".
 */

/**
 * @param value - A `Retry-After` header value, or seconds as a number.
 * @param now - Epoch milliseconds an HTTP date is measured from.
 * @returns Whole seconds to wait (never negative), or `null` when unreadable.
 */
export function parseRetryAfter(
  value: unknown,
  now: number = Date.now(),
): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) && value >= 0 ? Math.ceil(value) : null;
  }
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();
  if (/^\d+$/.test(text)) {
    return Number(text);
  }
  // Dates only: `Date.parse` would also accept bare numbers such as "-5".
  if (!/[a-z]/i.test(text)) {
    return null;
  }

  const date = Date.parse(text);
  if (Number.isNaN(date)) {
    return null;
  }
  return Math.max(0, Math.ceil((date - now) / 1000));
}

export interface RetryAfterWait {
  unit: "seconds" | "minutes";
  count: number;
}

/** The wait as the UI words it: seconds below a minute, else minutes. */
export function retryAfterWait(seconds: number): RetryAfterWait {
  if (seconds < 60) {
    return { unit: "seconds", count: Math.max(1, Math.ceil(seconds)) };
  }
  return { unit: "minutes", count: Math.ceil(seconds / 60) };
}

interface RateLimitedError {
  status?: number;
  statusCode?: number;
  response?: {
    status?: number;
    headers?: { get?: (name: string) => string | null };
  };
  data?: {
    params?: { retryAfterSeconds?: unknown };
    data?: { retryAfterSeconds?: unknown };
  };
}

/**
 * Reads a rejected `$fetch` — the backend's answer inside a Nitro proxy, or
 * the proxy's answer inside the browser.
 *
 * @returns `null` when the error is not a `429`; otherwise the seconds to
 *   wait, `null` when the answer names none.
 */
export function rateLimitWait(
  error: unknown,
  now: number = Date.now(),
): { seconds: number | null } | null {
  if (!error || typeof error !== "object") {
    return null;
  }
  const failure = error as RateLimitedError;
  const status =
    failure.response?.status ?? failure.statusCode ?? failure.status;
  if (status !== 429) {
    return null;
  }

  const seconds =
    parseRetryAfter(failure.response?.headers?.get?.("retry-after"), now) ??
    parseRetryAfter(failure.data?.params?.retryAfterSeconds, now) ??
    parseRetryAfter(failure.data?.data?.retryAfterSeconds, now);
  return { seconds };
}
