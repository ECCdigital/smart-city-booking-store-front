export function useMobileKey() {
  const openMobileKey = async (tenantID, processId, bookingId) => {
    const api = useApiClient();

    console.log("Fetching mobile key for booking:", {
      tenantID,
      processId,
      bookingId,
    });
    const { data, error } = await api.post(
      `/api/bookings/${tenantID}/${bookingId}/mobile-key/${processId}/open`,
    );

    if (error) {
      console.error("Error fetching mobile key:", error);
      throw error;
    }

    console.log("Mobile key data received:", data);

    return data;
  };

  return { openMobileKey };
}
