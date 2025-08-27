export function useTenants() {
  const fetchTenants = async () => {
    const { apiFetch } = useApi();

    try {
      const response = await apiFetch("/api/tenants", {
        method: "GET",
      });

      return response;
    } catch (error) {
      console.error("Error fetching tenants:", error);
      throw error;
    }
  };
  return {
    fetchTenants,
  };
}
