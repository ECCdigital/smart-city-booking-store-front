import { serverFetch } from "~~/server/api/utils/serverFetch.ts";
import { loadBundleData } from "~~/server/api/utils/loadBundleData.ts";
import { tenantMustBeListed } from "~~/server/api/utils/detailResolution.ts";
import { createConditionalCachedHandler } from "~~/server/utils/conditionalCache";
import { proxyErrorOf } from "~~/server/utils/proxyError";

export default createConditionalCachedHandler(
  async (event) => {
    const tenantID = getRouterParam(event, "tenantID");
    const { slug, bookableId, eventId, include, base } = getQuery(event);

    if (base === "false") {
      return await loadBundleData(event, {
        catalog: { type: "single", tenantId: tenantID },
        tenants: [{ id: tenantID }],
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
      throw createError(proxyErrorOf(error, "Failed to fetch catalog bundle"));
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

    if (
      tenantMustBeListed({ bookableId, eventId }) &&
      !result.tenants.some((t) => t.id === tenantID)
    ) {
      throw createError({ statusCode: 404, statusMessage: "Tenant Not Found" });
    }

    const scopedTenants = [{ id: tenantID }];
    const items = await loadBundleData(event, {
      catalog: { ...(result.catalog || {}), type: result.catalog?.type ?? "single", tenantId: tenantID },
      tenants: scopedTenants,
      bookableId,
      eventId,
      include,
    });

    return { ...result, ...items };
  },
  // Tenants and offers of the bundle carry a release (tenant supervision), so
  // the answer is never cached: a tenant going non-public shows on the very
  // next request.
  { releaseSensitive: true }
);
