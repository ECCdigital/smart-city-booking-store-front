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

  const getBookingCancellationReceipt = async (
    tenantID,
    bookingId,
    receiptName,
  ) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/cancellation-receipt/${receiptName}`,
      {},
    );

    if (error) {
      console.error("Error fetching booking cancellation receipt:", error);
      throw error;
    }

    return data;
  };

  const getStatus = async (tenantID, bookingId) => {
    const api = useApiClient();
    const { data, error } = await api.get(`/api/bookings/${tenantID}/${bookingId}/status`);
    if (error) {
      console.error("Error fetching booking status:", error);
      throw error;
    }
    return data;
  }

  /**
   * The refund the backend would grant if the owner cancelled now. Throws
   * the BFF error; the dialog shows the cancellation without a preview then.
   */
  const getCancellationRefundPreview = async (tenantID, bookingId) => {
    const api = useApiClient();
    const { data, error } = await api.get(
      `/api/bookings/${tenantID}/${bookingId}/cancellation-refund-preview`,
    );
    if (error) {
      console.error("Error fetching cancellation refund preview:", error);
      throw error;
    }
    return data;
  };

  /**
   * The direct cancellation of the owner's booking (ECCdigital/tickets#222).
   * Throws the BFF error: 400 `reason_required`, 404, 403
   * `booking_user_cancellation_disabled` (policy), 409 (no longer live).
   */
  const cancelBooking = async (
    tenantID,
    bookingId,
    { reason, bankDetails } = {},
  ) => {
    const api = useApiClient();
    const { data, error } = await api.post(
      `/api/bookings/${tenantID}/${bookingId}/cancel`,
      { reason, bankDetails },
    );
    if (error) {
      console.error("Error cancelling booking:", error);
      throw error;
    }
    return data;
  };

  return {
    fetchBookings,
    getBookingReceipt,
    getBookingInvoice,
    getBookingCancellationReceipt,
    getStatus,
    getCancellationRefundPreview,
    cancelBooking,
  };
}
