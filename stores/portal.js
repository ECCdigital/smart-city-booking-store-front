import { useCatalog } from "~/composables/api/useCatalog.js";

export const usePortalStore = defineStore("portal", {
  state: () => ({
    initialized: false,
    mode: null,
    branding: null,
    portalUrl: null,
    loadedFor: null,
  }),
  getters: {
    isOffersMode: (state) => state.mode === "offers",
    isPersonalMode: (state) => state.mode === "personal",
    logoUrl: (state) => state.branding?.logoUrl ?? null,
    faviconUrl: (state) => state.branding?.faviconUrl ?? null,
    themeColors: (state) => state.branding?.theme?.colors ?? null,
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
        this.branding = data.branding ?? null;
        this.portalUrl = data.portalUrl ?? null;
      } catch (error) {
        console.error("Error fetching portal mode:", error);
        this.mode = null;
        this.branding = null;
        this.portalUrl = null;
      }
    },
  },
});
