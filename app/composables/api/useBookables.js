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

  const getBlockPeriods = async ({
    tenantID,
    bookableId,
    startDate,
    endDate,
    amount = 1,
  }) => {
    const api = useApiClient();

    const params = new URLSearchParams();
    if (startDate != null && String(startDate).trim() !== "") {
      params.set("startDate", String(startDate));
    }
    if (endDate != null && String(endDate).trim() !== "") {
      params.set("endDate", String(endDate));
    }
    if (amount != null) {
      params.set("amount", String(amount));
    }

    const queryString = params.toString();
    const url = `/api/bookables/${tenantID}/block-periods/${bookableId}${
      queryString ? `?${queryString}` : ""
    }`;

    const { data, error } = await api.get(url);

    if (error) {
      console.error("Error fetching block periods:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchBookables,
    getBookableOccupancy,
    getBookableAvailability,
    getBookablePrice,
    getBlockPeriods,
  };
}
