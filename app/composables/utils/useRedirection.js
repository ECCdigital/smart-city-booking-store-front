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

  return { goToDetails };
}
