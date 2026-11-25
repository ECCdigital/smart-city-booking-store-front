export function useRedirection() {
  const { tenantTo } = useTenantRoute();

  // The detail page of an Offer, or null for a type without one. Links and
  // click handlers share it, so both open the same page.
  function detailsRoute(id, type) {
    if (type === "event") {
      return tenantTo(`/events/${id}`);
    }
    if (
      type === "room" ||
      type === "resource" ||
      type === "ticket" ||
      type === "event-location"
    ) {
      return tenantTo(`/bookables/${id}`);
    }
    return null;
  }

  function goToDetails(id, type) {
    const route = detailsRoute(id, type);
    if (route) {
      const router = useRouter();
      router.push(route);
    }
  }

  function goToDetailsNewTab(id, type) {
    const url =
      type === "event"
        ? tenantTo(`/events/${id}`)
        : ["room", "resource", "ticket", "event-location"].includes(type)
          ? tenantTo(`/bookables/${id}`)
          : null;
    if (url) {
        const router = useRouter();
        const routeData = router.resolve({path: url.path, query: url.query});
        window.open(routeData.href, "_blank");
    }
  }

  return { detailsRoute, goToDetails, goToDetailsNewTab };
}
