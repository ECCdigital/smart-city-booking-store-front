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
  return {
    fetchCatalog,
  };
}
