import type { H3Event } from "h3";
import AuthService from "~~/server/service/AuthService.js";
import { clientIpHeaders } from "~~/server/utils/rateLimit";
import { BACKEND_UNREACHABLE_STATUS } from "~~/server/utils/proxyError";

/**
 * The Nitro side of a customer upload (glossary "Kunden-Upload", in the UI
 * "Nachweis"): the multipart body goes to the
 * backend as a stream, never buffered here. What the storefront can tell
 * before the backend is asked it refuses itself, with the backend's codes:
 * no multipart body, a body above the instance limit. Everything the
 * backend refuses comes back with its status and body as they are.
 *
 * The checkout with the files of its upload fields
 * goes the same way: without a sign-in for a guest, and up to the limit of
 * a booking over all its files.
 */

const MEGABYTE = 1024 * 1024;
/** What a multipart envelope adds to the file: boundaries and part headers. */
export const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
/** The instance limit when the backend does not name one. */
export const DEFAULT_MAX_FILE_SIZE_MB = 10;
/** The instance limit of a booking's files when the backend names none. */
export const DEFAULT_MAX_TOTAL_SIZE_MB_PER_BOOKING = 100;
/** A token this close to its expiry is renewed before the stream starts. */
const TOKEN_RENEWAL_MARGIN_MS = 30_000;
const LIMITS_CACHE_MS = 5 * 60_000;

export const CUSTOMER_UPLOAD_CODES = Object.freeze({
  FILE_MISSING: "customer_upload_file_missing",
  TOO_LARGE: "customer_upload_too_large",
  BOOKING_LIMIT: "customer_upload_booking_limit",
});

/** The instance limits of customer uploads, as the backend answers them. */
export type CustomerUploadLimits = {
  maxFileSizeMb: number;
  maxTotalSizeMbPerBooking: number;
};

/** The largest body a route takes, and how it refuses a larger one. */
export type BodyLimit = {
  maxMb: number;
  code: string;
  params: Record<string, unknown>;
};

/** One file: the limit of the instance per file. */
export const singleFileLimit = (limits: CustomerUploadLimits): BodyLimit => ({
  maxMb: limits.maxFileSizeMb,
  code: CUSTOMER_UPLOAD_CODES.TOO_LARGE,
  params: { maxFileSizeMb: limits.maxFileSizeMb },
});

/** The files of a checkout: the limit of the instance per booking. */
export const checkoutLimit = (limits: CustomerUploadLimits): BodyLimit => ({
  maxMb: limits.maxTotalSizeMbPerBooking,
  code: CUSTOMER_UPLOAD_CODES.BOOKING_LIMIT,
  params: { maxTotalSizeMb: limits.maxTotalSizeMbPerBooking },
});

/** The error body of the backend, as the pages read it. */
export function customerUploadRefusal(
  statusCode: number,
  code: string,
  params: Record<string, unknown> = {},
) {
  return {
    statusCode,
    statusMessage: "Customer upload refused",
    data: { error: "BadRequestError", code, statusCode, params },
  };
}

/**
 * The largest body that can carry a file of `maxFileSizeMb`.
 *
 * @param maxFileSizeMb - The instance limit of one customer upload.
 */
export function maxBodyBytes(maxFileSizeMb: number): number {
  return maxFileSizeMb * MEGABYTE + MULTIPART_OVERHEAD_BYTES;
}

/**
 * Whether a body announced at `contentLength` bytes can be a file within the
 * limit. An unannounced length (chunked) is counted while it streams.
 */
export function exceedsLimit(
  contentLength: string | undefined,
  maxFileSizeMb: number,
): boolean {
  if (!contentLength) return false;
  const length = Number(contentLength);
  return Number.isFinite(length) && length > maxBodyBytes(maxFileSizeMb);
}

/**
 * Whether a JWT expires within `marginMs`, read off its payload without
 * verifying it: only to renew it before a stream that cannot be sent twice.
 * A token that cannot be read is left to the backend.
 */
export function expiresSoon(
  token: string,
  now: number = Date.now(),
  marginMs: number = TOKEN_RENEWAL_MARGIN_MS,
): boolean {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    );
    return typeof payload.exp === "number" && payload.exp * 1000 - now < marginMs;
  } catch {
    return false;
  }
}

/**
 * Counts the bytes of a stream and fails it past `maxBytes`, so a body
 * without an announced length is cut off as early as one with.
 */
export function limitStream(
  body: ReadableStream<Uint8Array>,
  maxBytes: number,
): { stream: ReadableStream<Uint8Array>; exceeded: () => boolean } {
  let seen = 0;
  let over = false;
  const counter = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      seen += chunk.byteLength;
      if (seen > maxBytes) {
        over = true;
        controller.error(new Error("customer upload above the limit"));
        return;
      }
      controller.enqueue(chunk);
    },
  });
  return { stream: body.pipeThrough(counter), exceeded: () => over };
}

const DEFAULT_LIMITS: CustomerUploadLimits = Object.freeze({
  maxFileSizeMb: DEFAULT_MAX_FILE_SIZE_MB,
  maxTotalSizeMbPerBooking: DEFAULT_MAX_TOTAL_SIZE_MB_PER_BOOKING,
});

let cachedLimits: { limits: CustomerUploadLimits; at: number } | null = null;

const positiveOr = (value: unknown, fallback: number) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
};

/** The instance limits of customer uploads, as the backend answers them. */
async function instanceLimits(
  apiBaseUrl: string,
): Promise<CustomerUploadLimits> {
  if (cachedLimits && Date.now() - cachedLimits.at < LIMITS_CACHE_MS) {
    return cachedLimits.limits;
  }
  try {
    const instance = await $fetch<{
      customerUploadLimits?: Partial<CustomerUploadLimits>;
    }>(`${apiBaseUrl}/api/instances/public`);
    const named = instance?.customerUploadLimits ?? {};
    const limits = {
      maxFileSizeMb: positiveOr(
        named.maxFileSizeMb,
        DEFAULT_LIMITS.maxFileSizeMb,
      ),
      maxTotalSizeMbPerBooking: positiveOr(
        named.maxTotalSizeMbPerBooking,
        DEFAULT_LIMITS.maxTotalSizeMbPerBooking,
      ),
    };
    cachedLimits = { limits, at: Date.now() };
    return limits;
  } catch {
    return DEFAULT_LIMITS;
  }
}

/** Forgets the cached instance limits; for tests. */
export function resetCustomerUploadLimitCache(): void {
  cachedLimits = null;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
}

/**
 * Streams the multipart body of the request to the backend's customer
 * upload route and answers what the backend answers.
 *
 * @param event - The request of the storefront.
 * @param options.method - `POST` to hand in, `PUT` to replace.
 * @param options.path - The backend path, e.g.
 *   `/api/v2/<tenant>/bookings/<id>/customer-uploads/<fieldId>`.
 * @param options.requireSignIn - Whether the route needs a session; the
 *   checkout takes a guest too.
 * @param options.bodyLimit - The largest body of the route from the
 *   instance limits, by default one file.
 * @param options.withSession - Whether the session's token goes along; not
 *   for a guest with the signed link of a booking,
 *   whose stale cookie must not stand in the way.
 * @param options.headers - Further headers to the backend, e.g. the link.
 * @param options.fetchImpl - The fetch to the backend; for tests.
 */
export async function forwardCustomerUpload(
  event: H3Event,
  {
    method,
    path,
    requireSignIn = true,
    bodyLimit = singleFileLimit,
    withSession = true,
    headers = {},
    fetchImpl = fetch,
  }: {
    method: "POST" | "PUT";
    path: string;
    requireSignIn?: boolean;
    bodyLimit?: (limits: CustomerUploadLimits) => BodyLimit;
    withSession?: boolean;
    headers?: Record<string, string>;
    fetchImpl?: typeof fetch;
  },
) {
  const { apiBaseUrl } = useRuntimeConfig();
  const contentType = getRequestHeader(event, "content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("multipart/form-data")) {
    throw createError(
      customerUploadRefusal(400, CUSTOMER_UPLOAD_CODES.FILE_MISSING),
    );
  }

  const limit = bodyLimit(await instanceLimits(apiBaseUrl));
  const tooLarge = () =>
    createError(customerUploadRefusal(400, limit.code, limit.params));
  const contentLength = getRequestHeader(event, "content-length");
  if (exceedsLimit(contentLength, limit.maxMb)) {
    throw tooLarge();
  }

  let token = withSession ? getCookie(event, "access-token") : undefined;
  if (!token && requireSignIn) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  // The stream goes once: a token about to expire is renewed before.
  if (token && expiresSoon(token)) {
    token = (await AuthService.renewAccessToken(event)) ?? token;
  }

  const body = getRequestWebStream(event);
  if (!body) {
    throw createError(
      customerUploadRefusal(400, CUSTOMER_UPLOAD_CODES.FILE_MISSING),
    );
  }
  const limited = limitStream(body, maxBodyBytes(limit.maxMb));

  let response: Response;
  try {
    response = await fetchImpl(`${apiBaseUrl}${path}`, {
      method,
      headers: {
        // The length is left to the stream: the backend reads it chunked.
        "content-type": contentType,
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...headers,
        ...clientIpHeaders(event),
      },
      body: limited.stream,
      // A stream as the body of a request needs half duplex in Node's fetch.
      duplex: "half",
    } as RequestInit);
  } catch {
    if (limited.exceeded()) {
      throw tooLarge();
    }
    throw createError({
      statusCode: BACKEND_UNREACHABLE_STATUS,
      statusMessage: "Backend unreachable",
    });
  }

  const data = await readBody(response);
  if (!response.ok) {
    const retryAfter = response.headers.get("retry-after");
    if (retryAfter) {
      setResponseHeader(event, "Retry-After", retryAfter);
    }
    throw createError({
      statusCode: response.status,
      statusMessage: response.statusText || "Customer upload refused",
      data,
    });
  }

  setResponseStatus(event, response.status);
  return data;
}

/**
 * The backend path of the customer upload route the storefront route
 * stands for: the field, and the upload with `withMedia`.
 */
export function customerUploadPath(
  event: H3Event,
  { withMedia = false }: { withMedia?: boolean } = {},
): string {
  const param = (name: string) =>
    encodeURIComponent(getRouterParam(event, name) ?? "");
  const field = `/api/v2/${param("tenantID")}/bookings/${param(
    "bookingId",
  )}/customer-uploads/${param("fieldId")}`;
  return withMedia ? `${field}/${param("mediaId")}` : field;
}
