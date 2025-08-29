export function useCatalog() {
  const fetchCatalog = async (slug) => {
    const { apiFetch } = useApi();

    try {
      const response = await apiFetch(`/api/catalog/${slug}`, {
        method: "GET",
      });

      return response;
    } catch (error) {
      console.error("Error fetching catalog:", error);
      throw error;
    }
  };

  const fetchCatalogBundle = async ({slug, bookableID = null, eventID = null, include = null}) => {
    const { apiFetch } = useApi();

    try {
      const response = await apiFetch(`/api/catalog/${slug}/bundle`, {
        params: {
          bookableId: bookableID,
          eventId: eventID,
          include
        },
        method: "GET",
      });

      return response;
    } catch (error) {
      console.error("Error fetching catalog bundle:", error);
      throw error;
    }
  }

  return {
    fetchCatalog,
    fetchCatalogBundle,
  };
}
