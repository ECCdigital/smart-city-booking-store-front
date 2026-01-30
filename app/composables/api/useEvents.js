export function useEvents() {
  const fetchEvents = async (tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/events/${tenantID}`);

    if (error) {
      throw error;
    }

    return data;
  };
  return {
    fetchEvents,
  };
}
