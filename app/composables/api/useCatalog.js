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
    tenantID = null,
    bookableID = null,
    eventID = null,
    include = null,
  } = {}) => {
    const api = useApiClient();
    const url = tenantID
      ? `/api/catalog/${tenantID}/bundle`
      : `/api/catalog/bundle`;

    const { data, error } = await api.get(url, {
      params: {
        bookableId: bookableID,
        eventId: eventID,
        include,
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
