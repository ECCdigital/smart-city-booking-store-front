export function useTenant() {
  const route = useRoute();

  const tenantID = computed(() => (route.params.tenantID as string) || null);

  const isTenantContext = computed(() => !!tenantID.value);

  return { tenantID, isTenantContext };
}
