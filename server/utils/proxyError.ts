/**
 * What a Nitro proxy passes on when the backend refuses a request: the
 * backend's status code and its error body (with the code or reason the
 * client reads). The storefront adds no rule of its own, and an error never
 * becomes a successful empty answer.
 */

/** The backend did not answer at all: connection refused, timeout, DNS. */
export const BACKEND_UNREACHABLE_STATUS = 502;

export type UpstreamFailure = {
  status: number;
  message: string;
  /** The error body of the backend, as it sent it. */
  data?: unknown;
};

type RejectedFetch = {
  statusCode?: number;
  statusMessage?: string;
  data?: unknown;
};

function isErrorStatus(status: unknown): status is number {
  return typeof status === "number" && status >= 400 && status <= 599;
}

/** The view `serverFetch` takes of a rejected `$fetch`. */
export function upstreamErrorOf(rejected: unknown): UpstreamFailure {
  const { statusCode, statusMessage, data } = (rejected ?? {}) as RejectedFetch;

  if (!isErrorStatus(statusCode)) {
    return {
      status: BACKEND_UNREACHABLE_STATUS,
      message: "Backend unreachable",
      data: undefined,
    };
  }

  return { status: statusCode, message: statusMessage ?? "Unknown error", data };
}

/**
 * The input of `createError` for a failed `serverFetch`:
 * `throw createError(proxyErrorOf(error, "Failed to fetch …"))`.
 *
 * @param error - The `error` of a `serverFetch` result.
 * @param statusMessage - The route's own message; the backend's otherwise.
 */
export function proxyErrorOf(error: UpstreamFailure, statusMessage?: string) {
  return {
    statusCode: isErrorStatus(error.status)
      ? error.status
      : BACKEND_UNREACHABLE_STATUS,
    statusMessage: statusMessage || error.message || "Backend request failed",
    data: error.data,
  };
}
