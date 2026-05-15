import type { H3Event } from "h3";
import type { FetchError } from "ofetch";
import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";

type Result<T> =
  | { data: T; error: null }
  | {
      data: null;
      error: { status: number; message: string; data?: unknown };
    };

export async function serverFetch<T>(
  event: H3Event,
  path: string,
  options: NitroFetchOptions<NitroFetchRequest> = {}
): Promise<Result<T>> {
  const token = getCookie(event, "access-token");
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
    const error = err as FetchError;
    return {
      data: null,
      error: {
        status: error.statusCode ?? 500,
        message: error.statusMessage ?? "Unknown error",
        data: error.data,
      },
    };
  }
}
