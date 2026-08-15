import type { FetchError } from "ofetch";
import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";
import { useAuthStore } from "~~/stores/auth";

type Result<T> =
  | { data: T; error: null }
  | {
      data: null;
      error: { statusCode: number; statusMessage: string; data?: unknown };
    };

type RequestOptions = Omit<NitroFetchOptions<NitroFetchRequest>, "method">;
type RequestBody = BodyInit | Record<string, unknown> | null;

async function handleAuthFailure(url: string, statusCode: number) {
  if (statusCode !== 401 || import.meta.server) return;
  // Auth endpoints manage their own flow
  if (url.includes("/api/auth/")) return;

  const authStore = useAuthStore();
  if (!authStore.isLoggedIn && !authStore.tokenValid) return;

  const stillValid = await authStore.validateAuth(true);
  if (!stillValid) {
    await authStore.handleInvalidSession({ redirect: true });
  }
}

export function useApiClient() {
  const requestFetch = useRequestFetch();

  async function request<T>(
    url: string,
    opts: NitroFetchOptions<NitroFetchRequest> = {}
  ): Promise<Result<T>> {
    try {
      const data = await requestFetch<T>(url, {
        ...opts,
        credentials: "include",
      });

      return { data, error: null };
    } catch (err) {
      const error = err as FetchError;
      const statusCode = error.statusCode ?? 500;

      await handleAuthFailure(url, statusCode);

      return {
        data: null,
        error: {
          statusCode,
          statusMessage: error.statusMessage ?? "Unknown error",
          data: error.data,
        },
      };
    }
  }

  return {
    get: <T>(url: string, opts?: RequestOptions) =>
      request<T>(url, { ...opts, method: "GET" }),

    post: <T>(url: string, body?: RequestBody, opts?: RequestOptions) =>
      request<T>(url, { ...opts, method: "POST", body }),

    put: <T>(url: string, body?: RequestBody, opts?: RequestOptions) =>
      request<T>(url, { ...opts, method: "PUT", body }),

    patch: <T>(url: string, body?: RequestBody, opts?: RequestOptions) =>
      request<T>(url, { ...opts, method: "PATCH", body }),

    delete: <T>(url: string, opts?: RequestOptions) =>
      request<T>(url, { ...opts, method: "DELETE" }),
  };
}
