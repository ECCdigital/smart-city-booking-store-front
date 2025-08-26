export function useEvents() {
  const fetchEvents = async (tenantID) => {
    try {
      const response = await $fetch(`/api/events/${tenantID}`, {
        method: "GET",
        credentials: "include",
      });
      return response;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw new Error("Failed to fetch events");
    }
  };
  return {
    fetchEvents,
  };
}
