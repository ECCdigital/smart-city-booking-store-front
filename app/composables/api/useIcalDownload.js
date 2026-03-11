export function useIcalDownload() {
  const downloadEventIcal = async (eventId, tenantId) => {
    const api = useApiClient();

    console.log("Downloading iCal for event ID:", eventId, "and tenant ID:", tenantId);

    const { data, error } = await api.get(`/api/events/ical`, {
      params: { eventId, tenantId },
    });
    if (error) {
      console.error("Error downloading iCal:", error);
      throw error;
    }

    console.log("iCal data received:", data);
    return data;
  };

  return {
    downloadEventIcal,
  };
}
