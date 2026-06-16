import {useTenantStore} from "~~/stores/tenant.js";

export function useTenant() {
  const route = useRoute();

  const tenantID = computed(() => (route.params.tenantID as string) || null);

  const isTenantContext = computed(() => !!tenantID.value);

  function getTenantName(tenantId: string) {
      const tenantsStore = useTenantStore();

          const tenant = tenantsStore.getTenantById(tenantId);
          if (tenant) {
              return tenant.name;
          }
          return "Unbekannt";

  }

  return { tenantID, isTenantContext, getTenantName };
}
