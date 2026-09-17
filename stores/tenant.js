import { useTenants } from "~/composables/api/useTenants.js";
import { hasAccessApps, withAccessApps } from "~/utils/emergencyHelp.js";

export const useTenantStore = defineStore("tenant", {
  state: () => ({
    initialized: false,
    tenants: [],
    loadedFor: null,
    currentTenantID: null,
  }),
  getters: {
    getTenants: (state) => state.tenants,
    getTenantById: (state) => (id) => state.tenants.find((t) => t.id === id),
    getCurrentTenantID: (state) => state.currentTenantID,
    getCurrentTenant: (state) => {
      return state.tenants.find((t) => t.id === state.currentTenantID) || null;
    },
  },
  actions: {
    async fetchTenants({ force = false } = {}) {
      if (this.initialized && !force) return this.tenants;
      const { fetchTenants } = useTenants();
      try {
        this.tenants = await fetchTenants();
      } catch {
        this.tenants = [];
      } finally {
        this.initialized = true;
      }
      return this.tenants;
    },
    /**
     * Makes sure every tenant in the store carries its `accessApps`. The
     * catalog bundle fills the store with the catalog's reduced projection
     * and marks it initialized, so `fetchTenants` alone would never bring
     * them; this loads the public list once more and merges the apps in by
     * id without replacing the list. A failed load leaves the store as it is.
     */
    async fetchAccessApps() {
      if (hasAccessApps(this.tenants)) return this.tenants;
      const { fetchTenants } = useTenants();
      try {
        const publicTenants = await fetchTenants();
        this.tenants = withAccessApps(this.tenants, publicTenants);
        this.initialized = true;
      } catch {
        // keep what is there
      }
      return this.tenants;
    },
    setCurrentTenantID(tenantID) {
      this.currentTenantID = tenantID;
    },
  },
  persist: {
    key: "tenant-store",
    storage: import.meta.client ?  localStorage : undefined,
    paths: ["currentTenantID"],
  },
});
