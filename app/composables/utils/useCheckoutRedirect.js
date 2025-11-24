export function useCheckoutRedirect() {
  /** Redirects the user to the checkout page for a given bookable item and tenant.
   *
   * @param {string} bookableId - The unique identifier of the bookable item.
   * @param {string} tenantId - The identifier of the tenant.
   */
  function redirectToCheckout(bookableId, tenantId) {
    const config = useRuntimeConfig();
    const baseFromConfig =
      (config && config.public && config.public.adminBaseUrl) ||
      config.adminBaseUrl ||
      "";

    if (!baseFromConfig) {
      console.warn(
        "adminBaseUrl not set in runtime config; falling back to relative /checkout path",
      );
    }

    const base = baseFromConfig.replace(/\/$/, "") || ""; // remove trailing slash if present

    const params = new URLSearchParams({
      id: bookableId,
      tenant: tenantId,
      amount: "1",
    });

    const url = base
      ? `${base}/checkout?${params.toString()}`
      : `/checkout?${params.toString()}`;

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
