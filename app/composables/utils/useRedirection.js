export function useRedirection() {
  const { tenantTo } = useTenantRoute();

  function goToDetails(id, type) {
    const router = useRouter();
    if (type === "event") {
      router.push(tenantTo(`/events/${id}`));
    } else if (
      type === "room" ||
      type === "resource" ||
      type === "ticket" ||
      type === "event-location"
    ) {
      router.push(tenantTo(`/bookables/${id}`));
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

  return { goToDetails, goToDetailsNewTab };
}
