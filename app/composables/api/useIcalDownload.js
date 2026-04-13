export function useIcalDownload() {
  const downloadEventIcal = async (eventId, tenantId) => {
    const api = useApiClient();
    const { data, error } = await api.get(`/api/events/ical`, {
      params: { eventId, tenantId },
    });
    if (error) throw error;
    triggerIcsDownload(data, `veranstaltung-${eventId}.ics`);
  };

  const downloadBookingIcal = async (
      bookingId,
      tenantId
  ) => {
    const api = useApiClient();
    const { data, error } = await api.get(`/api/bookings/ical`, {
      params: { bookingId, tenantId },
    });
    if (error) throw error;
    triggerIcsDownload(data, `buchung-${bookingId}.ics`);
  };

  const triggerIcsDownload = (icalData, filename) => {
    const blob = new Blob([icalData], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return {
    downloadEventIcal,
      downloadBookingIcal
  };
}
