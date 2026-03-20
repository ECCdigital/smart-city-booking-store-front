export function useMobileKey() {
  const openMobileKey = async (tenantID, processId, bookingId) => {
    const api = useApiClient();

    const { data, error } = await api.post(
      `/api/bookings/${tenantID}/${bookingId}/mobile-key/${processId}/open`,
    );

    if (error) {
      console.error("Error fetching mobile key:", error);
      throw error;
    }

    return data;
  };

  const checkMobileKeyStatus = async (
    tenantID,
    processId,
    bookingId,
    boxId,
  ) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/mobile-key/${processId}/status`,
      { query: { openBoxId: boxId } },
    );

    if (error) {
      console.error("Error checking mobile key status:", error);
      throw error;
    }

    return data;
  };

  return { openMobileKey, checkMobileKeyStatus };
}
