export function useCatalog() {
  const fetchCatalog = async (slug = null) => {
    const { apiFetch } = useApi();

    console.log("Fetching catalog with slug:", slug);

    try {
      let response;
      if (!slug) {
        response = await apiFetch(`/api/catalog/`, {
          method: "GET",
        });
      } else {
        response = await apiFetch(`/api/catalog/${slug}`, {
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
    slug = null,
    bookableID = null,
    eventID = null,
    include = null,
  }) => {
    const { apiFetch } = useApi();

    try {
      let response;
      if (!slug) {
        response = await apiFetch(`/api/catalog/bundle`, {
          params: {
            bookableId: bookableID,
            eventId: eventID,
            include,
          },
          method: "GET",
        });
      } else {
        response = await apiFetch(`/api/catalog/${slug}/bundle`, {
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
