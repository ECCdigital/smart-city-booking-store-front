import type { H3Event } from "h3";
import { serverFetch } from "./serverFetch";
import {
  detailCandidateTenants,
  resolveDetail,
  type DetailFetchResult,
  type DetailKind,
} from "./detailResolution";

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
  | { data: null; error: { status: number; message: string } };

/**
 * One bookable or event for a direct link: asked in every tenant that can
 * hold it, listed in the bundle or not — the backend decides.
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
  });
  return hit?.item ?? null;
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
  return responses.flatMap(({ data, error }) =>
    !error && Array.isArray(data) ? data : []
  );
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
      const bookable = await loadDetailItem(event, "bookable", bookableId, params);
      if (bookable) result.bookable = bookable;
      return result;
    }

    if (eventId) {
      const item = await loadDetailItem(event, "event", eventId, params);
      if (item) result.event = item;
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
      const bookable = await loadDetailItem(event, "bookable", bookableId, params);
      if (!bookable) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bookable not found",
        });
      }
      result.bookable = bookable;
      return result;
    }

    if (eventId) {
      const item = await loadDetailItem(event, "event", eventId, params);
      if (!item) {
        throw createError({
          statusCode: 404,
          statusMessage: "Event not found",
        });
      }
      result.event = item;
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
          if (!error) result.events = Array.isArray(data) ? data : [];
        })
      );
    }
    await Promise.all(tasks);
  }

  return result;
}
