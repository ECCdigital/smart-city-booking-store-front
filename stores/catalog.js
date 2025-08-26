import { useCatalog } from "~/composables/api/useCatalog.js";

export const useCatalogStore = defineStore("catalog", {
  state: () => ({
    catalog: null,
    loading: false,
    error: null,
  }),
  getters: {
    getCatalog: (state) => state.catalog,
    isLoading: (state) => state.loading,
    getError: (state) => state.error,
  },
  actions: {
    async fetchCatalog(slug) {
      const { fetchCatalog } = useCatalog();
      this.loading = true;
      this.error = null;

      try {
        this.catalog = await fetchCatalog(slug);
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
