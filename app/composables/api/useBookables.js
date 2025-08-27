export function useBookables() {
  const fetchBookables = async (tenantID) => {
    const { apiFetch } = useApi();

    try {
      const response = await apiFetch(`/api/bookables/${tenantID}`, {
        method: "GET",
      });

      console.log(response);

      return response;
    } catch (error) {
      console.error("Error fetching bookables:", error);
      throw error;
    }
  };
  return {
    fetchBookables,
  };
}
