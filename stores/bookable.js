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
  },
  actions: {
    async fetchBookables(tenantID) {
      const { fetchBookables } = useBookables();
      try {
        this.bookables = await fetchBookables(tenantID);
        return this.bookables;
      } catch (error) {
        console.error("Error fetching bookables:", error);
        this.bookables = [];
      }
    },
  },
});
