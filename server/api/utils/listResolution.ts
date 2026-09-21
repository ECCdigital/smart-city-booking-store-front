/**
 * The bookable or event list of a catalog, asked per tenant. A tenant the
 * backend no longer delivers (404) is left out. A backend that fails is not
 * an empty list: when no tenant delivers a list and at least one failed, the
 * answer is an error. One failing tenant among others that answer does not
 * take the catalog down.
 */

export type ListFetchFailure = { status: number; message: string; data?: unknown };

export type ListFetchResult<T> =
  | { data: T[] | unknown; error: null }
  | { data: null; error: ListFetchFailure };

export class ListResolutionError extends Error {
  upstream: ListFetchFailure;

  constructor(upstream: ListFetchFailure) {
    super(`List resolution failed: ${upstream.status} ${upstream.message}`);
    this.name = "ListResolutionError";
    this.upstream = upstream;
  }
}

export function mergeTenantLists<T>(results: ListFetchResult<T>[]): T[] {
  const delivered = results.filter((result) => !result.error);
  const failure = results.find(
    (result) => result.error && result.error.status !== 404,
  )?.error;

  if (delivered.length === 0 && failure) {
    throw new ListResolutionError(failure);
  }

  return delivered.flatMap(({ data }) => (Array.isArray(data) ? (data as T[]) : []));
}
