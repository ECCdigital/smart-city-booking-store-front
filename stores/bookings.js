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
    /**
     * Takes the state of a booking's customer uploads as an upload route
     * answers it, so the pages show it without loading every booking again.
     */
    setCustomerUploadState(bookingId, customerUploadState) {
      const booking = this.bookings.find((b) => b.id === bookingId);
      if (booking && customerUploadState) {
        booking.customerUploadState = customerUploadState;
      }
    },
    async fetchBookings({ force = false } = {}) {
      if (this.initialized && !force) return this.bookings;
      const { fetchBookings } = useBookings();
      try {
        this.bookings = await fetchBookings();
        this.initialized = true;
        return this.bookings;
      } catch (error) {
        console.error("Error fetching bookings:", error);
        this.bookings = [];
      }
    },
  },
});
