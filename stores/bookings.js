import { useBookings } from "~/composables/api/useBookings.js";

export const useBookingStore = defineStore("booking", {
  state: () => ({
    initialized: false,
    bookings: [],
  }),
  getters: {
    getBookings: (state) => state.bookings,
    getBookingById: (state) => (id) => state.bookings.find((b) => b.id === id),
    getBookingsByBookableId: (state) => (bookableId) =>
      state.bookings.filter((b) => b.bookableId === bookableId),
  },
  actions: {
    async fetchBookings() {
      const { fetchBookings } = useBookings();
      try {
        this.bookings = await fetchBookings();
        return this.bookings;
      } catch (error) {
        console.error("Error fetching bookings:", error);
        this.bookings = [];
      }
    },
  },
});
