export function useMemberships() {
  const fetchMyMemberships = async () => {
    const api = useApiClient();

    const { data, error } = await api.get("/api/memberships/my");

    if (error) {
      console.error("Error fetching memberships:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchMyMemberships,
  };
}
