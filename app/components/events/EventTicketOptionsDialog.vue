<template>
  <UModal v-model:open="model" :title="$t('events.selectTicketOption')">
    <template #body>
      <div v-if="!registrationNeeded" class="flex justify-center p-2 my-5 mb-2">
        <p class="text-lg text-center md:text-left">
          <i18n-t keypath="events.forThisEvent" tag="span" scope="global">
            <template #status
              ><b>{{ $t("events.noRegistrationNeededShort") }}</b></template
            >
          </i18n-t>
          <br ><br >
          {{ $t("events.isFreeToAttend") }}
        </p>
      </div>
      <div v-else-if="isPrivateEvent" class="flex justify-center p-2 my-5 mb-2">
        <p class="text-lg text-center md:text-left">
          {{ $t("events.notPublicShort") }}
        </p>
      </div>
      <div v-else-if="tickets.length === 0">
        <p class="text-lg text-center md:text-left">
          {{ $t("events.noTicketsShort") }}
        </p>
      </div>
      <div v-else>
        <p class="mb-5">
          {{ $t("events.chooseTicketOption") }}
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
