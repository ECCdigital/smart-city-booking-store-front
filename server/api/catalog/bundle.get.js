import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { loadBundleData } from "~~/server/api/utils/loadBundleData.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";
import { proxyErrorOf } from "~~/server/utils/proxyError";

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
      tenantHint,
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
        tenantHint: tenantHint ? String(tenantHint) : null,
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
      throw createError(
        errorMapping[error.status] ||
          proxyErrorOf(error, "Error fetching catalog bundle"),
      );
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
      tenantHint: tenantHint ? String(tenantHint) : null,
    });

    return { ...result, ...items };
  },
  // Tenants and offers of the bundle carry a release (tenant supervision), so
  // the answer is never cached: a block shows on the very next request.
  { releaseSensitive: true }
);
