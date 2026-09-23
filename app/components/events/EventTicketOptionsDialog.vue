<template>
  <UModal v-model:open="model" :title="$t('events.selectTicketOption')">
    <template #body>
      <div v-if="!registrationNeeded" class="flex justify-center p-2 my-5 mb-2">
        <p class="text-lg text-center md:text-left">
          Für das Event ist <b>{{ $t("events.noRegistrationNeededShort") }}</b>. <br ><br >
          Sie können ohne Buchung teilnehmen.
        </p>
      </div>
      <div v-else-if="isPrivateEvent" class="flex justify-center p-2 my-5 mb-2">
        <p class="text-lg text-center md:text-left">
          Das Event ist nicht öffentlich und kann nicht gebucht werden.
        </p>
      </div>
      <div v-else-if="tickets.length === 0">
        <p class="text-lg text-center md:text-left">
          Es sind keine Tickets für dieses Event verfügbar.
        </p>
      </div>
      <div v-else>
        <p class="mb-5">
          Wählen Sie zur Buchung einer der folgenden Ticketoptionen:
        </p>
        <EventTicketStrip
          v-for="(ticket, i) in props.tickets"
          :key="i"
          :ticket="ticket"
        />
      </div>
    </template>
  </UModal>
</template>
<script setup>
import EventTicketStrip from "~/components/events/EventTicketStrip.vue";

const model = defineModel();
const props = defineProps({
  tickets: {
    type: Array,
    required: true,
  },
  isPrivateEvent: {
    type: Boolean,
    default: false,
  },
  registrationNeeded: {
    type: Boolean,
    default: false,
  },
});
</script>

<style scoped></style>
