/**
 * The view the auth routes take of a rejected `$fetch`.
 *
 * `FetchError` from ofetch types `response` as a `Response`, which carries no
 * parsed body, so the routes that read the backend's message off
 * `error.response.data` cannot use it. This is the shape those routes actually
 * read, and nothing more: cast a caught error to it rather than to `any`, the
 * way `serverFetch` casts to `FetchError`.
 *
 * Every field is optional. A rejected fetch may carry none of them, which is
 * why the call sites all fall back to a status of 500 and a message of their
 * own.
 */

/** The error body the backend sends alongside a non-2xx status. */
interface UpstreamErrorBody {
  message?: string;
  reason?: string;
}

export interface UpstreamError {
  status?: number;
  data?: UpstreamErrorBody;
  response?: {
    status?: number;
    statusText?: string;
    data?: UpstreamErrorBody;
  };
}
