import type { H3Event } from "h3";
import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import AuthService from "~~/server/service/AuthService.js";
import { upstreamErrorOf } from "~~/server/utils/proxyError";

type Result<T> =
  | { data: T; error: null }
  | {
      data: null;
      error: { status: number; message: string; data?: unknown };
    };

async function backendFetch<T>(
  path: string,
  options: NitroFetchOptions<NitroFetchRequest>,
  token: string | null | undefined
): Promise<Result<T>> {
  const { apiBaseUrl: API_BASE_URL } = useRuntimeConfig();

  try {
    const data = await $fetch<T>(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    return { data, error: null };
  } catch (err) {
    // The backend's status and error body; 502 when it did not answer.
    return { data: null, error: upstreamErrorOf(err) };
  }
}

/**
 * Calls the backend with the session's access token.
 *
 * A `401` to a token it sent means the token has expired or is no longer
 * valid (ECCdigital/tickets#108, #109): the call renews the token and asks
 * exactly once more. When the renewal fails, the session is over, its cookies
 * are cleared and the caller gets the backend's `401`.
 */
export async function serverFetch<T>(
  event: H3Event,
  path: string,
  options: NitroFetchOptions<NitroFetchRequest> = {}
): Promise<Result<T>> {
  const token = getCookie(event, "access-token");
  const result = await backendFetch<T>(path, options, token);
  if (!token || result.error?.status !== 401) return result;

  if (event.context.cache) {
    // Inside a cached handler (`createConditionalCachedHandler`) Nitro keeps
    // the answer with its cookies and hands it to other visitors: no session
    // cookies here. The answer is the same for everyone, so ask anonymously.
    return backendFetch<T>(path, options, null);
  }

  const renewedToken = await AuthService.renewAccessToken(event);
  if (!renewedToken) return result;
  return backendFetch<T>(path, options, renewedToken);
}
