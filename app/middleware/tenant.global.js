import { useTenantStore } from "~~/stores/tenant.js";

export default defineNuxtRouteMiddleware(async (to, from) => {
  const tenantStore = useTenantStore();
  const tenantID = to.query.tenantId;

  if (!tenantID) return;

  if (!tenantStore.initialized) {
    await tenantStore.fetchTenants();
  }

  if (tenantID && tenantStore.getTenantById(tenantID)) {
    tenantStore.setCurrentTenantID(tenantID);
  }
});
