import type { H3Event } from "h3";
import { forwardedFor } from "~~/shared/utils/forwardedFor";
import { rateLimitWait } from "~~/shared/utils/retryAfter";

/**
 * Hands a backend `429` on as it is: same status, same `Retry-After` header,
 * the seconds once more in the error data for the page to show. Does nothing
 * for any other error, so a route calls it first in its `catch`.
 */
export function throwIfRateLimited(event: H3Event, error: unknown): void {
  const wait = rateLimitWait(error);
  if (!wait) {
    return;
  }

  if (wait.seconds !== null) {
    setResponseHeader(event, "Retry-After", wait.seconds);
  }
  throw createError({
    statusCode: 429,
    statusMessage: "Too Many Requests",
    data: { retryAfterSeconds: wait.seconds },
  });
}

/**
 * Headers that let the backend count its per-IP limits against the visitor
 * instead of the storefront server.
 */
export function clientIpHeaders(event: H3Event): Record<string, string> {
  const value = forwardedFor(
    getRequestHeader(event, "x-forwarded-for"),
    event.node.req.socket?.remoteAddress,
  );
  return value ? { "X-Forwarded-For": value } : {};
}
