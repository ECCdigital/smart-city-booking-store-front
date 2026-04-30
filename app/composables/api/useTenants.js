export function useTenants() {
  const fetchTenants = async () => {
    const api = useApiClient();

    const { data, error } = await api.get("/api/tenants");

    if (error) {
      console.error("Error fetching tenants:", error);
      throw error;
    }

    return data;
  };

  const fetchTenant = async (tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/tenants/${tenantID}`);

    if (error) {
      console.error("Error fetching tenant:", error);
      throw error;
    }

    return data;
  }

  return {
    fetchTenants,
    fetchTenant,
  };
}
