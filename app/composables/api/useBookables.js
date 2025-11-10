export function useBookables() {
  const fetchBookables = async (tenantID) => {
    const { apiFetch } = useApi();

    console.log("#################### TEST 1 #################################")
    try {
      const response = await apiFetch(`/api/bookables/${tenantID}`, {
        method: "GET",
      });

        console.log("#################### TEST 2 #################################")
        console.log(response);

      return response;
    } catch (error) {
      console.error("Error fetching bookables:", error);
      throw error;
    }
  };
  const getBookableAvailability = async (tenantID, bookableId, start, end) => {
    const { apiFetch } = useApi();
    try {
      const response = await apiFetch(
        `/api/bookables/${tenantID}/availability/${bookableId}`,
        {
          method: "POST",
          body: {
            start: start,
            end: end,
          },
        },
      );

      console.log(response);

      return response;
    } catch (error) {
      console.error("Error checking bookable availability:", error);
      throw error;
    }
  };
  const getBookablePrice = async (tenantID, bookableId, start, end) => {
    const { apiFetch } = useApi();
    try {
      const response = await apiFetch(
        `/api/bookables/${tenantID}/price/${bookableId}`,
        {
          method: "POST",
          body: {
            start: start,
            end: end,
          },
        },
      );

      console.log(response);

      return response;
    } catch (error) {
      console.error("Error checking bookable availability:", error);
      throw error;
    }
  };
  return {
    fetchBookables,
    getBookableAvailability,
    getBookablePrice,
  };
}
