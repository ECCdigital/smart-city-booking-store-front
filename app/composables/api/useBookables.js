export function useBookables() {
  const fetchBookables = async (tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/bookables/${tenantID}`);

    if (error) {
      throw error;
    }

    return data;
  };
  const getBookableOccupancy = async (tenantID, bookableId, start, end) => {
    const api = useApiClient();

    const { data, error } = await api.post(
      `/api/bookables/${tenantID}/occupancy/${bookableId}`,
      {
        start: start,
        end: end,
      }
    );

    if (error) {
      console.error("Error checking bookable occupancy:", error);
      throw error;
    }

    return data;
  };
  const getBookableAvailability = async ({
    tenantID,
    bookableId,
    start,
    end,
    amount = 1,
  }) => {
    const api = useApiClient();
    const { data, error } = await api.get(
      `/api/bookables/${tenantID}/availability/${bookableId}/?start=${start}&end=${end}&amount=${amount}`,
    );

    if (error) {
      console.error("Error checking bookable availability:", error);
      throw error;
    }

    return data;
  };

  const getBookablePrice = async (tenantID, bookableId, start, end) => {
    const api = useApiClient();

    const { data, error } = await api.post(
      `/api/bookables/${tenantID}/price/${bookableId}`,
      {
        start: start,
        end: end,
      }
    );

    if (error) {
      return null;
    }

    return data;
  };
  return {
    fetchBookables,
    getBookableOccupancy,
    getBookableAvailability,
    getBookablePrice,
  };
}
