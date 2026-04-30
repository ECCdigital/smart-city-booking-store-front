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
    bookWithPrice = true,
  }) => {
    const api = useApiClient();

    console.log("validateBookable", bookableID, tenantID, amount, start, end, couponCode, bookWithPrice);

    const { data, error } = await api.post(
      `/api/checkout/${bookableID}/validate`,
      { amount, start, end, couponCode, bookWithPrice, tenantID }
    );
    if (error) {
      console.error("Error fetching bookable:", error);
      throw error;
    }
    return data;
  };

  return { fetchBookable, validateBookable };
}
