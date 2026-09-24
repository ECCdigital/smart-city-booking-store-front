import type { H3Event } from "h3";
import { serverFetch } from "./serverFetch";
import {
  DetailResolutionError,
  detailCandidateTenants,
  resolveDetail,
  type DetailFetchResult,
  type DetailKind,
} from "./detailResolution";
import { ListResolutionError, mergeTenantLists } from "./listResolution";
import { proxyErrorOf } from "~~/server/utils/proxyError";

type Tenant = { id: string };

type CatalogShape = {
  type?: "instance" | "single" | string;
  tenantId?: string | null;
} | null;

type LoadParams = {
  catalog: CatalogShape;
  tenants: Tenant[];
  bookableId?: string;
  eventId?: string;
  include?: string;
  /** The tenant a direct link names explicitly (`?tenantId=`). */
  tenantHint?: string | null;
};

export type BundleItems = {
  bookable?: unknown;
  event?: unknown;
  bookables?: unknown[];
  events?: unknown[];
};

type FetchResult<T> =
  | { data: T; error: null }
  | { data: null; error: { status: number; message: string; data?: unknown } };

/** A backend failure stays an error, with the backend's status and body. */
function rethrowUpstream(err: unknown, statusMessage: string): never {
  if (
    err instanceof DetailResolutionError ||
    err instanceof ListResolutionError
  ) {
    throw createError(proxyErrorOf(err.upstream, statusMessage));
  }
  throw err;
}

/** A list the backend fails to deliver is an error, not an empty list. */
function failOnBackendFailure(
  error: { status: number; message: string; data?: unknown } | null,
  statusMessage: string
) {
  if (error && error.status !== 404) {
    throw createError(proxyErrorOf(error, statusMessage));
  }
}

/**
 * One bookable or event for a direct link: asked in every tenant that can
 * hold it, listed in the bundle or not — the backend decides. What it
 * delivers for no tenant is "not available": a 404, whatever the catalog type.
 */
async function loadDetailItem(
  event: H3Event,
  kind: DetailKind,
  id: string,
  { catalog, tenants, tenantHint }: LoadParams
) {
  const hit = await resolveDetail({
    kind,
    id,
    tenantIds: detailCandidateTenants({
      catalogTenantId: catalog?.type === "single" ? catalog.tenantId : null,
      listedTenantIds: tenants.map((tenant) => tenant.id),
      tenantHint,
    }),
    fetch: (path) =>
      serverFetch<unknown>(event, path, {
        method: "GET",
      }) as Promise<DetailFetchResult>,
  }).catch((err) => rethrowUpstream(err, `Failed to fetch ${kind}`));

  if (!hit) {
    throw createError({
      statusCode: 404,
      statusMessage:
        kind === "bookable" ? "Bookable not found" : "Event not found",
    });
  }
  return hit.item;
}

async function fetchListAcrossTenants<T>(
  event: H3Event,
  tenants: Tenant[],
  path: (tenantId: string) => string
): Promise<T[]> {
  const responses = await Promise.all(
    tenants.map(
      (t) =>
        serverFetch<T[]>(event, path(t.id), {
          method: "GET",
        }) as Promise<FetchResult<T[]>>
    )
  );
  try {
    return mergeTenantLists<T>(responses);
  } catch (err) {
    return rethrowUpstream(err, "Failed to fetch catalog list");
  }
}

export async function loadBundleData(
  event: H3Event,
  params: LoadParams
): Promise<BundleItems> {
  const { catalog, tenants, bookableId, eventId, include } = params;
  const result: BundleItems = {};
  const includes = include?.split(",").map((s) => s.trim()) ?? [];

  if (catalog?.type === "instance") {
    if (bookableId) {
      result.bookable = await loadDetailItem(event, "bookable", bookableId, params);
      return result;
    }

    if (eventId) {
      result.event = await loadDetailItem(event, "event", eventId, params);
      return result;
    }

    const tasks: Promise<void>[] = [];
    if (includes.includes("bookables")) {
      tasks.push(
        fetchListAcrossTenants<unknown>(
          event,
          tenants,
          (id) => `/json/${id}/bookables/`
        ).then((data) => {
          result.bookables = data;
        })
      );
    }
    if (includes.includes("events")) {
      tasks.push(
        fetchListAcrossTenants<unknown>(
          event,
          tenants,
          (id) => `/json/${id}/events/`
        ).then((data) => {
          result.events = data;
        })
      );
    }
    await Promise.all(tasks);
    return result;
  }

  if (catalog?.type === "single") {
    const tenantId = catalog.tenantId ?? null;
    if (!tenantId) {
      throw createError({
        statusCode: 404,
        statusMessage: "Catalog or tenant not found",
      });
    }

    if (bookableId) {
      result.bookable = await loadDetailItem(event, "bookable", bookableId, params);
      return result;
    }

    if (eventId) {
      result.event = await loadDetailItem(event, "event", eventId, params);
      return result;
    }

    const tasks: Promise<void>[] = [];
    if (includes.includes("bookables")) {
      tasks.push(
        (
          serverFetch<{ bookables?: unknown[] }>(
            event,
            `/json/${tenantId}/bookables/`,
            { method: "GET" }
          ) as Promise<FetchResult<{ bookables?: unknown[] }>>
        ).then(({ data, error }) => {
          failOnBackendFailure(error, "Failed to fetch bookables");
          if (!error) result.bookables = data?.bookables ?? [];
        })
      );
    }
    if (includes.includes("events")) {
      tasks.push(
        (
          serverFetch<unknown[]>(event, `/json/${tenantId}/events/`, {
            method: "GET",
          }) as Promise<FetchResult<unknown[]>>
        ).then(({ data, error }) => {
          failOnBackendFailure(error, "Failed to fetch events");
          if (!error) result.events = Array.isArray(data) ? data : [];
        })
      );
    }
    await Promise.all(tasks);
  }

  return result;
}
