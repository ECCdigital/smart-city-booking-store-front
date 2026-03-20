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
    openBoxId,
  ) => {
    const api = useApiClient();

    console.log(`Checking mobile key status for tenant ${tenantID}, booking ${bookingId}, process ${processId}, box ${openBoxId}`);

    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/mobile-key/${processId}/status`,
      { query: { openBoxId: openBoxId } },
    );

    if (error) {
      console.error("Error checking mobile key status:", error);
      throw error;
    }

    return data;
  };

  return { openMobileKey, checkMobileKeyStatus };
}
