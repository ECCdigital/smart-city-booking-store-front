export function useEvents() {
  const fetchEvents = async (tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/events/${tenantID}`);

    if (error) {
      throw error;
    }

    return data;
  };
  const fetchEventById = async (tenantID, eventID) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/events/${tenantID}/event/${eventID}`,
    );

    if (error) {
      throw error;
    }

    return data;
  };

  return {
    fetchEvents,
    fetchEventById,
  };
}
