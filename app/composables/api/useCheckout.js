import { permissionCheckOfFailure } from "~/utils/checkoutLogin.js";
import { useAuthStore } from "~~/stores/auth";

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
    bookWithoutDiscount = false,
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
      bookWithoutDiscount,
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

  const validateGroupBookable = async ({
    tenantID,
    bookableItems,
    bookingAttempts,
    checkoutId = null,
    couponCode = null,
    bookWithoutDiscount = false,
  }) => {
    const api = useApiClient();

    const trimmedCode =
      couponCode != null && String(couponCode).trim() !== ""
        ? String(couponCode).trim()
        : null;

    const body = {
      tenantID,
      bookableItems,
      bookingAttempts,
      bookWithoutDiscount,
    };
    if (checkoutId) {
      body.checkoutId = checkoutId;
    }
    if (trimmedCode) {
      body.couponCode = trimmedCode;
    }

    const { data, error } = await api.post(
      `/api/checkout/group-validate`,
      body,
    );
    if (error) {
      console.error("Error validating group booking:", error);
      throw error;
    }
    return data;
  };

  const fetchCheckoutPermissions = async (tenantID, bookableID) => {
    const api = useApiClient();
    const { data, error } = await api.get(`/api/checkout/${bookableID}/permissions/?tenantID=${tenantID}`);
    if (error) {
      // The same rule as at the completion: a 401 asks for a sign-in when it
      // carries the reason or nobody is signed in any more (tickets#108).
      const check = permissionCheckOfFailure(error, {
        isLoggedIn: useAuthStore().isLoggedIn,
      });
      if (check) return check;
      throw error;
    }
    return data;
  }

  return {
    fetchBookable,
    validateBookable,
    validateGroupBookable,
    redeemCoupon,
    completeCheckout,
    completeGroupCheckout,
    fetchCheckoutPermissions,
  };
}
