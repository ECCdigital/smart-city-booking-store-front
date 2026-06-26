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


  const completeCheckout = async (payload) => {
    const api = useApiClient();
    return api.post(`/api/checkout/complete`, payload);
  };

  const completeGroupCheckout = async (payload) => {
    const api = useApiClient();
    return api.post(`/api/checkout/group-complete`, payload);
  };

  const fetchCheckoutPermissions = async (tenantID, bookableID) => {
    const api = useApiClient();
    const { data, error } = await api.get(`/api/checkout/${bookableID}/permissions/?tenantID=${tenantID}`);
    if (error) {
      console.error("Error fetching checkout permissions:", error);
      return {
        success: false,
        error: {
          checkType: "permissions",
          reason: "checkout.permission_denied",
        },
      };
    }
    return data;
  }

  return { fetchBookable, validateBookable, redeemCoupon, completeCheckout, completeGroupCheckout, fetchCheckoutPermissions };
}
