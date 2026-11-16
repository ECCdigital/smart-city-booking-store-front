import type { H3Event } from "h3";
import { proxyErrorOf, upstreamErrorOf } from "~~/server/utils/proxyError";
import { clientIpHeaders } from "~~/server/utils/rateLimit";

/**
 * The Nitro side of a guest's signed link: a
 * booking made without an account gets one link for all its upload fields,
 * a guest's series one link for all its bookings (`{t, g}`).
 * The page sends the token in `X-Customer-Upload-Link`; the BFF reads tenant
 * and booking off it to build the backend path and hands the token on - with
 * a series' link the page names the booking (`?booking=…`). The
 * backend alone checks the signature, that the booking is one the link
 * opens and the end of the booking. No
 * session goes along: the link stands in for the sign-in.
 */

export const LINK_HEADER = "x-customer-upload-link";

/** A token a page cannot even read is refused before the backend. */
export const LINK_INVALID_CODE = "customer_upload_link_invalid";

type LinkTarget =
  | { tenantId: string; bookingId: string }
  | { tenantId: string; groupBookingId: string };

/**
 * Tenant and booking - or group, for a series' link - a token names, read
 * off its payload without verifying the signature: only to build the
 * backend path.
 *
 * @param token - The token of the link.
 */
export function linkTargetOf(
  token: string | undefined | null,
): LinkTarget | null {
  if (typeof token !== "string") return null;
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;
  try {
    const { t, b, g } = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    );
    if (typeof t !== "string" || !t) return null;
    if (typeof b === "string" && b && g === undefined) {
      return { tenantId: t, bookingId: b };
    }
    if (typeof g === "string" && g && b === undefined) {
      return { tenantId: t, groupBookingId: g };
    }
    return null;
  } catch {
    return null;
  }
}

function linkInvalid() {
  return createError({
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

/**
 * The backend path of the link's booking and the header with the token:
 * the booking of a booking's link, the one the page names (`?booking=…`)
 * with a series' link. With `all`, the path of every booking the link
 * opens.
 *
 * @param event - The request of the page.
 * @param rest - The path below `customer-uploads-by-link`, e.g. `/field-1`.
 * @param options.all - Every booking of the link instead of one.
 */
export function linkRequestOf(
  event: H3Event,
  rest = "",
  { all = false }: { all?: boolean } = {},
): { path: string; headers: Record<string, string> } {
  const token = getRequestHeader(event, LINK_HEADER) ?? "";
  const target = linkTargetOf(token);
  if (!target) throw linkInvalid();
  const tenant = encodeURIComponent(target.tenantId);
  const headers = { [LINK_HEADER]: token };
  if (all) {
    return { path: `/api/v2/${tenant}/customer-uploads-by-link`, headers };
  }
  const named = getQuery(event).booking;
  const bookingId =
    "bookingId" in target
      ? target.bookingId
      : typeof named === "string" && named
        ? named
        : null;
  if (!bookingId) throw linkInvalid();
  return {
    path: `/api/v2/${tenant}/bookings/${encodeURIComponent(
      bookingId,
    )}/customer-uploads-by-link${rest}`,
    headers,
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
 * @param options.all - Every booking of the link, see {@link linkRequestOf}.
 */
export async function forwardByLink<T>(
  event: H3Event,
  method: "GET" | "DELETE",
  rest = "",
  fetchImpl: typeof $fetch = $fetch,
  { all = false }: { all?: boolean } = {},
): Promise<T> {
  const { apiBaseUrl } = useRuntimeConfig();
  const { path, headers } = linkRequestOf(event, rest, { all });
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
