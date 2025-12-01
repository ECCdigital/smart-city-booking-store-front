export function useCatalog() {
  const fetchCatalog = async (tenantID = null) => {
    const { apiFetch } = useApi();

    try {
      let response;
      if (!tenantID) {
        response = await apiFetch(`/api/catalog/`, {
          method: "GET",
        });
      } else {
        response = await apiFetch(`/api/catalog/${tenantID}`, {
          method: "GET",
        });
      }

      return response;
    } catch (error) {
      console.error("Error fetching catalog:", error);
      throw error;
    }
  };

  const fetchCatalogBundle = async ({
    tenantID = null,
    bookableID = null,
    eventID = null,
    include = null,
  }) => {
    const { apiFetch } = useApi();

    try {
      let response;
      if (!tenantID) {
        response = await apiFetch(`/api/catalog/bundle`, {
          params: {
            bookableId: bookableID,
            eventId: eventID,
            include,
          },
          method: "GET",
        });
      } else {
        response = await apiFetch(`/api/catalog/${tenantID}/bundle`, {
          params: {
            bookableId: bookableID,
            eventId: eventID,
            include,
          },
          method: "GET",
        });
      }

      return response;
    } catch (error) {
      console.error("Error fetching catalog bundle:", error);
      throw error;
    }
  };

  return {
    fetchCatalog,
    fetchCatalogBundle,
  };
}
