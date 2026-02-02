import type { FetchError } from "ofetch";
import type { NitroFetchOptions, NitroFetchRequest } from "nitropack";

type Result<T> =
  | { data: T; error: null }
  | { data: null; error: { statusCode: number; statusMessage: string } };

type RequestOptions = Omit<NitroFetchOptions<NitroFetchRequest>, "method">;
type RequestBody = BodyInit | Record<string, unknown> | null;

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

      return {
        data: null,
        error: {
          statusCode: error.statusCode ?? 500,
          statusMessage: error.statusMessage ?? "Unknown error",
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
