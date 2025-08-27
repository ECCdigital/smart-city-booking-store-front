export function useEvents() {
  const fetchEvents = async (tenantID) => {
    const { apiFetch } = useApi();

    try {
      const response = await apiFetch(`/api/events/${tenantID}`, {
        method: "GET",
      });

      return response;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  };
  return {
    fetchEvents,
  };
}
