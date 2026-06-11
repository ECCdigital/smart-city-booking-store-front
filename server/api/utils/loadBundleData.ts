import type { H3Event } from "h3";
import { serverFetch } from "./serverFetch";

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

async function fetchSingleAcrossTenants<T>(
  event: H3Event,
  tenants: Tenant[],
  path: (tenantId: string) => string
) {
  const responses = await Promise.all(
    tenants.map(async (tenant) => {
      const res = (await serverFetch<T>(event, path(tenant.id), {
        method: "GET",
      })) as FetchResult<T>;
      return { tenant, ...res };
    })
  );
  return responses.find((r) => !r.error && r.data != null) ?? null;
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
  { catalog, tenants, bookableId, eventId, include }: LoadParams
): Promise<BundleItems> {
  const result: BundleItems = {};
  const includes = include?.split(",").map((s) => s.trim()) ?? [];

  if (catalog?.type === "instance") {
    if (bookableId) {
      const hit = await fetchSingleAcrossTenants<unknown>(
        event,
        tenants,
        (id) => `/json/${id}/bookables/${bookableId}`
      );
      if (hit?.data) result.bookable = hit.data;
      return result;
    }

    if (eventId) {
      const hit = await fetchSingleAcrossTenants<unknown>(
        event,
        tenants,
        (id) => `/json/${id}/events/${eventId}`
      );
      if (hit?.data) result.event = hit.data;
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
      const { data, error } = (await serverFetch<{ bookable?: unknown }>(
        event,
        `/json/${tenantId}/bookables/${bookableId}`,
        { method: "GET" }
      )) as FetchResult<{ bookable?: unknown }>;
      if (error || !data?.bookable) {
        throw createError({
          statusCode: 404,
          statusMessage: "Bookable not found",
        });
      }
      result.bookable = data.bookable;
      return result;
    }

    if (eventId) {
      const { data, error } = (await serverFetch<{ event?: unknown }>(
        event,
        `/json/${tenantId}/events/${eventId}`,
        { method: "GET" }
      )) as FetchResult<{ event?: unknown }>;
      if (error || !data?.event) {
        throw createError({
          statusCode: 404,
          statusMessage: "Event not found",
        });
      }
      result.event = data.event;
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
