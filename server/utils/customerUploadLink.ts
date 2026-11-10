import type { H3Event } from "h3";
import { proxyErrorOf, upstreamErrorOf } from "~~/server/utils/proxyError";
import { clientIpHeaders } from "~~/server/utils/rateLimit";

/**
 * The Nitro side of a guest's signed link: a
 * booking made without an account gets one link for all its upload fields.
 * The page sends the token in `X-Customer-Upload-Link`; the BFF reads tenant
 * and booking off it to build the backend path and hands the token on. The
 * backend alone checks the signature and the end of the booking. No
 * session goes along: the link stands in for the sign-in.
 */

export const LINK_HEADER = "x-customer-upload-link";

/** A token a page cannot even read is refused before the backend. */
export const LINK_INVALID_CODE = "customer_upload_link_invalid";

/**
 * Tenant and booking a token names, read off its payload without verifying
 * the signature: only to build the backend path.
 *
 * @param token - The token of the link.
 */
export function linkTargetOf(
  token: string | undefined | null,
): { tenantId: string; bookingId: string } | null {
  if (typeof token !== "string") return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  try {
    const { t, b } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof t !== "string" || !t || typeof b !== "string" || !b) {
      return null;
    }
    return { tenantId: t, bookingId: b };
  } catch {
    return null;
  }
}

/**
 * The backend path of the link's booking and the header with the token.
 *
 * @param event - The request of the page.
 * @param rest - The path below `customer-uploads-by-link`, e.g. `/field-1`.
 */
export function linkRequestOf(
  event: H3Event,
  rest = "",
): { path: string; headers: Record<string, string> } {
  const token = getRequestHeader(event, LINK_HEADER) ?? "";
  const target = linkTargetOf(token);
  if (!target) {
    throw createError({
      statusCode: 403,
      statusMessage: "Invalid link",
      data: {
        error: "ForbiddenError",
        code: LINK_INVALID_CODE,
        statusCode: 403,
        params: {},
      },
    });
  }
  return {
    path: `/api/v2/${encodeURIComponent(target.tenantId)}/bookings/${encodeURIComponent(
      target.bookingId,
    )}/customer-uploads-by-link${rest}`,
    headers: { [LINK_HEADER]: token },
  };
}

/** The path below the booking for a field, and an upload with `withMedia`. */
export function linkFieldPath(
  event: H3Event,
  { withMedia = false }: { withMedia?: boolean } = {},
): string {
  const param = (name: string) =>
    encodeURIComponent(getRouterParam(event, name) ?? "");
  const field = `/${param("fieldId")}`;
  return withMedia ? `${field}/${param("mediaId")}` : field;
}

/**
 * A request without a body to the backend for the link's booking, without
 * the session; the backend's refusal is passed on with its status, body and
 * `Retry-After`.
 *
 * @param event - The request of the page.
 * @param method - `GET` to read, `DELETE` to delete.
 * @param rest - The path below `customer-uploads-by-link`.
 * @param fetchImpl - The `$fetch` to the backend; for tests.
 */
export async function forwardByLink<T>(
  event: H3Event,
  method: "GET" | "DELETE",
  rest = "",
  fetchImpl: typeof $fetch = $fetch,
): Promise<T> {
  const { apiBaseUrl } = useRuntimeConfig();
  const { path, headers } = linkRequestOf(event, rest);
  try {
    return (await fetchImpl(`${apiBaseUrl}${path}`, {
      method,
      headers: { ...headers, ...clientIpHeaders(event) },
    })) as T;
  } catch (rejected) {
    const error = upstreamErrorOf(rejected);
    if (error.status === 429) {
      const seconds = (error.data as { params?: { retryAfterSeconds?: number } })
        ?.params?.retryAfterSeconds;
      if (seconds) setResponseHeader(event, "Retry-After", seconds);
    }
    throw createError(proxyErrorOf(error, "Customer upload by link refused"));
  }
}
