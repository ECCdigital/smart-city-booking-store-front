import { useTenants } from "~/composables/api/useTenants.js";

export const useTenantStore = defineStore("tenant", {
  state: () => ({
    initialized: false,
    tenants: [],
  }),
  getters: {
    getTenants: (state) => state.tenants,
    getTenantById: (state) => (id) => state.tenants.find((t) => t.id === id),
  },
  actions: {
    async fetchTenants() {
      const { fetchTenants } = useTenants();
      try {
        this.tenants = await fetchTenants();
      } catch (error) {
        console.error("Error fetching tenants:", error);
        this.tenants = [];
      }
    },
  },
});
