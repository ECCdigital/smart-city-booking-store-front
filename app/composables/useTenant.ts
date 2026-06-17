import {useTenantStore} from "~~/stores/tenant.js";

export function useTenant() {
  const route = useRoute();

  const tenantID = computed(() => (route.params.tenantID as string) || null);

  const isTenantContext = computed(() => !!tenantID.value);

    const tenantsStore = useTenantStore();

  function getTenant(tenantId: string){
      const tenant = tenantsStore.getTenantById(tenantId);
      if (tenant) {
          return tenant;
      }
      return {};
  }

  function getTenantName(tenantId: string) {

          const tenant = tenantsStore.getTenantById(tenantId);
          if (tenant) {
              return tenant.name;
          }
          return "Unbekannt";

  }

  return { tenantID, isTenantContext, getTenant, getTenantName };
}
