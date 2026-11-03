import { useInstance } from "~/composables/api/useInstance.js";

export const useInstanceStore = defineStore("instance", {
  state: () => ({
    initialized: false,
    instance: null,
  }),
  getters: {
    publicOffersEnabled: (state) =>
      state.instance?.publicOffersEnabled ?? false,
    portalUrl: (state) => state.instance?.portalUrl ?? null,
    ssoEnabled: (state) =>
      !!state.instance?.applications?.find(
        (app) => app.id === "keycloak" && app.active,
      ),
    // Whether any tenant of the instance has an active access or locking
    // system.
    usesDigitalKeys: (state) => state.instance?.usesDigitalKeys === true,
  },
  actions: {
    async initialize() {
      if (!this.initialized) {
        await this.fetchInstance();
        this.initialized = true;
      }
    },
    async fetchInstance() {
      const { fetchInstance } = useInstance();

      try {
        this.instance = await fetchInstance();
        console.log("*** Fetched instance:", this.instance);
      } catch (error) {
        console.error("Error fetching instance:", error);
        this.instance = null;
      }
    },
  },
});
