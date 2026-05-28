export function useCatalog() {
  const fetchPortalMode = async () => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/catalog/mode`);
    if (error) throw error;

    return data;
  };

  const fetchCatalog = async (slug = null) => {
    const api = useApiClient();
    const url = slug ? `/api/catalog/${slug}` : `/api/catalog/`;

    const { data, error } = await api.get(url);
    if (error) throw error;

    return data;
  };

  const fetchCatalogBundle = async ({
    slug = null,
    tenantID = null,
    bookableID = null,
    eventID = null,
    include = null,
    base = true,
    catalogType = null,
    catalogTenantID = null,
    tenantIDs = [],
  } = {}) => {
    const api = useApiClient();
    const url = tenantID
      ? `/api/catalog/${tenantID}/bundle`
      : `/api/catalog/bundle`;

    const { data, error } = await api.get(url, {
      params: {
        slug: slug || undefined,
        bookableId: bookableID || undefined,
        eventId: eventID || undefined,
        include: include || undefined,
        base: base === false ? "false" : undefined,
        catalogType: catalogType || undefined,
        catalogTenantId: catalogTenantID || undefined,
        tenantIds: tenantIDs.length ? tenantIDs.join(",") : undefined,
      },
    });
    if (error) {
      console.error("Error fetching catalog bundle:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchPortalMode,
    fetchCatalog,
    fetchCatalogBundle,
  };
}
