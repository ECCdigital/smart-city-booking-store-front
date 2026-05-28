import { useBookables } from "~/composables/api/useBookables.js";

export const useBookableStore = defineStore("bookable", {
  state: () => ({
    initialized: false,
    bookables: [],
  }),
  getters: {
    getBookables: (state) => state.bookables,
    getBookableById: (state) => (id) =>
      state.bookables.find((t) => t.id === id),
    getBookablesByType: (state) => (type) =>
      state.bookables.filter((b) => b.type === type),
    getRooms: (state) => state.bookables.filter((b) => b.type === "room"),
    getResources: (state) =>
      state.bookables.filter((b) => b.type === "resource"),
    getLocations: (state) =>
      state.bookables.filter((b) => b.type === "event-location"),
    getTickets: (state) => state.bookables.filter((b) => b.type === "ticket"),
  },
  actions: {
    async fetchBookables(tenantID, { force = false } = {}) {
      if (this.initialized && !force) return this.bookables;
      const { fetchBookables } = useBookables();
      try {
        this.bookables = await fetchBookables(tenantID);
        this.initialized = true;
        return this.bookables;
      } catch (error) {
        console.error("Error fetching bookables:", error);
        this.bookables = [];
      }
    },
    addOrUpdate(bookable) {
      const index = this.bookables.findIndex((b) => b.id === bookable.id);
      if (index !== -1) {
        this.bookables[index] = bookable;
      } else {
        this.bookables.push(bookable);
      }
    },
  },
});
