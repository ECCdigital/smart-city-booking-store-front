export function useInstance() {
  const fetchInstance = async () => {
    const api = useApiClient();

    const { data, error } = await api.get("/api/instance");

    if (error) {
      console.error("Error fetching instance:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchInstance,
  };
}
