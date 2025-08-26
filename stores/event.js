import {useEvents} from "~/composables/api/useEvents.js";

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
        async fetchEvents(tenantID) {
            const { fetchEvents } = useEvents();
            try {
                this.events = await fetchEvents(tenantID);
                return this.events;
            } catch (error) {
                console.error("Error fetching events:", error);
                this.events = [];
            }
        },
    },
});
