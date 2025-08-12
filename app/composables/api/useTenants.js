export function useTenants() {
  const fetchTenants = async () => {
    const { error, data } = await useFetch("/api/tenants", {
      method: "GET",
      server: true,
      credentials: "include",
    });

    if (error.value) {
        console.error("Error fetching tenants:", error.value);
      throw new Error("Failed to fetch tenants");
    }

    return data.value;
  };
  return {
    fetchTenants,
  };
}
