import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { loadBundleData } from "~~/server/api/utils/loadBundleData.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";

const errorMapping = {
  401: { statusCode: 401, statusMessage: "unauthorized" },
};

export default createConditionalCachedHandler(
  async (event) => {
    const {
      slug,
      bookableId,
      eventId,
      include,
      base,
      catalogType,
      catalogTenantId,
      tenantIds,
    } = getQuery(event);
    const tenantsFromQuery = tenantIds
      ? String(tenantIds)
          .split(",")
          .filter(Boolean)
          .map((id) => ({ id }))
      : [];
    const canSkipBase =
      base === "false" &&
      catalogType &&
      (catalogTenantId || tenantsFromQuery.length > 0);

    if (canSkipBase) {
      return await loadBundleData(event, {
        catalog: {
          type: String(catalogType),
          tenantId: catalogTenantId ? String(catalogTenantId) : null,
        },
        tenants: tenantsFromQuery,
        bookableId,
        eventId,
        include,
      });
    }

    const bundlePromise = serverFetch(event, `/api/catalog/bundle`, {
      method: "GET",
      query: slug ? { slug } : undefined,
    });

    const slugCatalogPromise = slug
      ? serverFetch(event, `/api/catalog/${slug}`, { method: "GET" })
      : Promise.resolve(null);

    const [{ data, error }, slugRes] = await Promise.all([
      bundlePromise,
      slugCatalogPromise,
    ]);

    if (error) {
      const mapped = errorMapping[error.status] || {
        statusCode: error.status || 500,
        statusMessage: error.message || "Error fetching catalog bundle",
      };
      throw createError(mapped);
    }

    const slugCatalog =
      slugRes && !slugRes.error ? slugRes.data?.catalog ?? slugRes.data : null;

    const result = {
      offersEnabled: data.offersEnabled,
      portalUrl: slugRes?.data?.portalUrl ?? data.portalUrl,
      catalog: slugCatalog ?? data.catalog,
      tenants: data.tenants ?? [],
    };

    if (!result.offersEnabled) {
      return result;
    }

    const items = await loadBundleData(event, {
      catalog: result.catalog,
      tenants: result.tenants,
      bookableId,
      eventId,
      include,
    });

    return { ...result, ...items };
  },
  {
    maxAge: 300,
    swr: true,
    authScoped: true,
    getKey: (event) => {
      const token = getCookie(event, "access-token");
      const scope = token ? "auth" : "anon";
      const { slug, bookableId, eventId, include } = getQuery(event);
      const { base, catalogType, catalogTenantId, tenantIds } = getQuery(event);
      const inc = include
        ? String(include).split(",").map((s) => s.trim()).sort().join(",")
        : "";
      return [
        "catalog-bundle",
        scope,
        slug ?? "root",
        bookableId ?? "-",
        eventId ?? "-",
        inc,
        base === "false" ? "items" : "base",
        catalogType ?? "-",
        catalogTenantId ?? "-",
        tenantIds ?? "-",
      ].join("::");
    },
  }
);
