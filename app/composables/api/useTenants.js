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

  const fetchTenantPaymentProviders = async (tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/tenants/${tenantID}/payment-providers`);

    if (error) {
      console.error("Error fetching tenant payment apps:", error);
      throw error;
    }

    return data;
  }

  const fetchTenantUserRoles = async (tenantID, { publicRoles = true } = {}) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/tenants/${tenantID}/user-roles?public=${publicRoles ? "true" : "false"}`
    );

    if (error) {
      console.error("Error fetching tenant user roles:", error);
      throw error;
    }

    return Array.isArray(data) ? data : [];
  };

  return {
    fetchTenants,
    fetchTenant,
    fetchTenantPaymentProviders,
    fetchTenantUserRoles,
  };
}
