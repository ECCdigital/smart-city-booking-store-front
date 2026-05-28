import { useTenants } from "~/composables/api/useTenants.js";

export const useTenantStore = defineStore("tenant", {
  state: () => ({
    initialized: false,
    tenants: [],
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
