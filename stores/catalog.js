import { useCatalog } from "~/composables/api/useCatalog.js";

/** @typedef {import("../shared/types/api").CatalogData} CatalogData */

export const useCatalogStore = defineStore("catalog", {
  state: () => ({
    /** @type {CatalogData | null} */
    catalog: null,
    loadedFor: null,
    loading: false,
    error: null,
  }),
  getters: {
    getCatalog: (state) => state.catalog,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },
  actions: {
    async fetchCatalog(tenantID) {
      const { fetchCatalog } = useCatalog();
      this.loading = true;
      this.error = null;

      try {
        this.catalog = await fetchCatalog(tenantID);
      } catch (error) {
        this.catalog = null;
        this.error = error;

        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
