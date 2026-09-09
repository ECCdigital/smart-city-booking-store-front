import { useCatalog } from "~/composables/api/useCatalog.js";

export const usePortalStore = defineStore("portal", {
  state: () => ({
    initialized: false,
    mode: null,
    portalUrl: null,
    loadedFor: null,
  }),
  getters: {
    isOffersMode: (state) => state.mode === "offers",
    isPersonalMode: (state) => state.mode === "personal",
  },
  actions: {
    async initialize() {
      if (this.initialized) return;
      await this.fetchMode();
      this.initialized = true;
    },
    async fetchMode() {
      const { fetchPortalMode } = useCatalog();
      try {
        const data = await fetchPortalMode();
        this.mode = data.mode;
        this.portalUrl = data.portalUrl ?? null;
      } catch (error) {
        console.error("Error fetching portal mode:", error);
        this.mode = null;
        this.portalUrl = null;
      }
    },
  },
});
