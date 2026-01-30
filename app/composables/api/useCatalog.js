export function useCatalog() {
  const fetchCatalog = async (tenantID = null) => {
    const api = useApiClient();
    const url = tenantID ? `/api/catalog/${tenantID}` : `/api/catalog/`;

    const { data, error } = await api.get(url);
    if (error) throw error;

    return data;
  };

  const fetchCatalogBundle = async ({
    tenantID = null,
    bookableID = null,
    eventID = null,
    include = null,
  }) => {
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
      console.error("Error fetching catalog bundle2:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchCatalog,
    fetchCatalogBundle,
  };
}
