export function useBookings() {
  const fetchBookings = async () => {
    const api = useApiClient();

    const { data, error } = await api.get(`/api/bookings/`);

    if (error) {
      return [];
    }

    return data;
  };

  const getBookingReceipt = async (tenantID, bookingId, receiptTitle) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/receipt/${receiptTitle}`,
      {},
    );

    if (error) {
      console.error("Error fetching booking receipt:", error);
      throw error;
    }

    return data;
  };

  const getBookingInvoice = async (tenantID, bookingId, invoiceTitle) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/invoice/${invoiceTitle}`,
      {},
    );

    if (error) {
      console.error("Error fetching booking invoice:", error);
      throw error;
    }

    return data;
  };

  return {
    fetchBookings,
    getBookingReceipt,
    getBookingInvoice,
  };
}
