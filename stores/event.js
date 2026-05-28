import { useEvents } from "~/composables/api/useEvents.js";

export const useEventStore = defineStore("event", {
  state: () => ({
    initialized: false,
    events: [],
  }),
  getters: {
    getEvents: (state) => state.events,
    getEventById: (state) => (id) => state.events.find((t) => t.id === id),
  },
  actions: {
    async fetchEvents(tenantID, { force = false } = {}) {
      if (this.initialized && !force) return this.events;
      const { fetchEvents } = useEvents();
      try {
        this.events = await fetchEvents(tenantID);
        this.initialized = true;
        return this.events;
      } catch (error) {
        console.error("Error fetching events:", error);
        this.events = [];
      }
    },
    async getEventTimeById(eventId) {
      const event = this.events.find((event) => event.id === eventId);
      if (!event) {
        return null;
      }

      const startString = `${event.information.startDate}T${event.information.startTime}:00`;
      const startTimestamp = new Date(startString).getTime();

      const endString = `${event.information.endDate}T${event.information.endTime}:00`;
      const endTimestamp = new Date(endString).getTime();

      return [startTimestamp, endTimestamp];
    },
    addOrUpdate(event) {
      const index = this.events.findIndex((e) => e.id === event.id);
      if (index !== -1) {
        this.events[index] = event;
      } else {
        this.events.push(event);
      }
    },
  },
});
