export function useCheckout() {
  const fetchBookable = async (bookableID, tenantID) => {
    const api = useApiClient();

    const { data, error } = await api.get(
      `/api/checkout/${bookableID}/?tenantID=${tenantID}`
    );

    if (error) {
      console.error("Error fetching bookable:", error);
      throw error;
    }

    return data;
  };

  const validateBookable = async ({
    bookableID,
    tenantID,
    amount = 1,
    start,
    end,
    couponCode = null,
    couponId = null,
    bookWithPrice = true,
  }) => {
    const api = useApiClient();

    const trimmedCode =
      couponCode != null && String(couponCode).trim() !== ""
        ? String(couponCode).trim()
        : null;
    const trimmedId =
      couponId != null && String(couponId).trim() !== ""
        ? String(couponId).trim()
        : null;

    const body = {
      amount,
      start,
      end,
      couponCode: trimmedCode,
      bookWithPrice,
      tenantID,
    };
    if (trimmedId) {
      body.couponId = trimmedId;
    }

    const { data, error } = await api.post(
      `/api/checkout/${bookableID}/validate`,
      body
    );
    if (error) {
      console.error("Error fetching bookable:", error);
      throw error;
    }
    return data;
  };

  /**
   * Prüft einen Gutschein beim Mandanten.
   * Erwartete Antwort (HTTP 200): { success: true, data: { id, description, discount, type: "fixed"|"percent"|"percentage" } }
   * oder { success: false, error: { reason, checkType, params } }.
   */
  const redeemCoupon = async ({ tenantID, couponCode }) => {
    const api = useApiClient();
    const { data, error } = await api.post(`/api/checkout/coupon`, {
      tenantID,
      couponCode,
    });
    if (error) {
      console.error("Error redeeming coupon:", error);
      throw error;
    }
    return data;
  };

  return { fetchBookable, validateBookable, redeemCoupon };
}
