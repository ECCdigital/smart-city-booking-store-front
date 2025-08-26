export function useBookables() {
  const fetchBookables = async (tenantID) => {
    try {
      const response = await $fetch(`/api/bookables/${tenantID}`, {
        method: "GET",
        credentials: "include",
      });
      return response;
    } catch (error) {
      console.error("Error fetching bookables:", error);
      throw new Error("Failed to fetch bookables");
    }
  };
  return {
    fetchBookables,
  };
}
