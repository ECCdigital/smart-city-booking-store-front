<template>
  <div>
    <h3 class="text-xl font-bold mb-5">Ticketoptionen</h3>

    <div v-if="hasTimeRelatedPrices" class="">
      <UAlert
        v-if="!timePeriod || (!timePeriod.start && !timePeriod.end)"
        title="Wählen Sie Daten aus, um die Verfügbarkeit und Preise zu sehen."
        icon="i-lucide-info"
        variant="ghost"
        class="p-2 text-info w-full"
      />
      <InputDateTimePeriod
        :time-period="timePeriod"
        class="border border-gray-400 dark:border-gray-600 rounded-lg mt-2 mb-5 w-full"
        @select-date="setSearchTimePeriod"
        @remove-date="removeSearchTimePeriod"
      />
    </div>

    <!--externe Tickets -->
    <div
      v-if="item.externalBookingUrl"
      class="bg-white dark:bg-gray-700 rounded-lg p-3 mb-2 flex content-center"
    >
      <span class="font-bold mr-1 content-center">{{
        item?.information.name
      }}</span>
      <div class="flex-1" />
      <UButton
        label="Beim Anbieter buchen"
        class="justify-center px-5"
        :style="{ color: contrastToPrimary }"
        @click="goToExternalCheckout()"
      />
    </div>

    <!-- private Events -->
    <EventInfoDisplay
      v-if="!item.attendees.publicEvent"
      title="Kein öffentliches Event."
      description="Das Event ist keine öffentliche Veranstaltung und kann deshalb nicht gebucht werden."
    />

    <!-- Events ohne Anmeldepflicht-->
    <EventInfoDisplay
      v-if="!item.attendees.needsRegistration"
      title="Keine Anmeldung nötig."
      description="Für dieses Event ist keine Anmeldung notwendig. Sie können auch ohne vorherige Anmeldung an der Veranstaltung teilnehmen."
    />

    <!-- keine Tickets hinterlegt -->
    <EventInfoDisplay
      v-if="
        item.attendees.publicEvent &&
        item.attendees.needsRegistration &&
        item.tickets.length === 0
      "
      title="Keine Tickets verfügbar."
      description="Für dieses Event sind derzeit keine Ticketoptionen hinterlegt."
    />

    <!-- Auflistung der Ticketoptionen -->
    <EventTicketStrip
      v-for="(ticket, i) in tickets"
      :key="i"
      :ticket="ticket"
      details-mode
    />
  </div>
</template>
<script setup>
import EventTicketStrip from "~/components/events/EventTicketStrip.vue";
import InputDateTimePeriod from "~/components/inputs/InputDateTimePeriod.vue";
import EventInfoDisplay from "~/components/events/EventInfoDisplay.vue";
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const {
  tickets,
  timePeriod,
  setSearchTimePeriod,
  removeSearchTimePeriod,
  contrastToPrimary,
  goToExternalCheckout,
} = useBookableDetailContent(() => props.item, true);

const hasTimeRelatedPrices = computed(() => {
  return props.item.tickets.some((ticket) =>
    ticket.priceCategories.some((c) => c.weekdays.length > 0),
  );
});
</script>

<style scoped></style>
