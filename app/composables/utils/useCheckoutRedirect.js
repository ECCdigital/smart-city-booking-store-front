export function useCheckoutRedirect() {
  /** Redirects the user to the checkout page for a given bookable item and tenant.
   *
   * @param {string} id - The unique identifier of the bookable item.
   * @param {string} tenantId - The identifier of the tenant.
   * @param {string|null} start - Optional start date for the booking.
   * @param {string|null} end - Optional end date for the booking.
   * @param {string} amount - The quantity of the item to be booked (default is "1").
   * @param {string|null} url - Optional URL to redirect to after checkout (default is "/checkout").
   */
  function redirectToCheckout({
    id,
    tenantId,
    start = null,
    end = null,
    amount = "1",
    url = null,
  }) {
    const options = { id: id, tenant: tenantId, amount: amount };

    if (start) {
      options.start = start;
    }
    if (end) {
      options.end = end;
    }

    const params = new URLSearchParams(options);

    if (url) {
      params.set("url", url);
    } else {
      params.set("url", "/checkout");
    }

    if (typeof window !== "undefined") {
      const newWindow = window.open(url, "_blank");
      if (newWindow) {
        try {
          newWindow.opener = null; // enforce noopener
        } catch (e) {
          console.error(e);
          // ignore in case browser forbids
        }
      } else {
        window.location.href = url;
      }
    } else {
      console.warn("Attempted to open checkout URL on server-side: ", url);
    }
  }

  return { redirectToCheckout };
}
