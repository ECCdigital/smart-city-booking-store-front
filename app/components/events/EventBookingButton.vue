<template>
  <div>
    <UTooltip :disabled="disableTooltip" :text="tooltipText">
      <div class="h-full">
        <UButton
            v-if="event.attendees.needsRegistration"
            :class="[
                isDirectConnection? 'px-5 mt-5 md:my-0' : 'px-10',
                bookingDisabled? 'bg-gray-400/30 dark:bg-gray-200/40 text-gray-800 dark:text-gray-900' : ''
                ]"
            :color="bookingDisabled? '' : 'primary'"
            :disabled="bookingDisabled"
            :icon="isDirectConnection ? 'i-lucide-shopping-cart' : ''"
            :label="isDirectConnection ? 'Jetzt buchen' : 'Buchen'"
            :style="{cursor: bookingDisabled? 'not-allowed' : 'pointer', color: bookingDisabled? '' : contrastToPrimary }"
            class="bookingButton justify-center h-full"
            @click="goToTicketOptions"
        />
        <UButton
            v-if="!event.attendees.needsRegistration"
            class="bookingButton justify-center px-3 bg-gray-400/30 dark:bg-gray-200/40 text-gray-800 dark:text-gray-900 mt-5 md:my-0"
            color=""
            disabled
            label="Keine Anmeldung nötig"
        />
      </div>
    </UTooltip>
    <EventTicketOptionsDialog
        v-model:open="openTicketOptions"
        :is-private-event="isPrivateEvent"
        :registration-needed="event.attendees.needsRegistration"
        :tickets="event.tickets"
    />
  </div>
</template>
<script setup>
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import {useCheckoutRedirect} from "~/composables/utils/useCheckoutRedirect.js";
import EventTicketOptionsDialog from "~/components/events/EventTicketOptionsDialog.vue";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  isDirectConnection: {
    type: Boolean,
    default: false,
  },
});

const hasEventTickets = computed(() => {
  return props.event.externalBookingUrl || props.event.tickets.length > 0;
});
const isPrivateEvent = computed(() => {
  return !props.event.attendees.publicEvent || false;
});

const disableTooltip = computed(() => {
  if (!props.event.attendees.needsRegistration) {
    return true;
  }
  return isPrivateEvent.value && !hasEventTickets.value;
});

const tooltipText = computed(() => {
  if (isPrivateEvent.value) {
    return "Das Event ist nicht öffentlich und kann nicht gebucht werden.";
  } else if (!hasEventTickets.value) {
    return "Für dieses Event sind keine Tickets verfügbar.";
  } else {
    return "";
  }
});

const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary()
);


const bookingDisabled = computed(
    () =>
        props.event.attendees.needsRegistration &&
        (isPrivateEvent.value || !hasEventTickets.value)
);

const openTicketOptions = ref(false);

function goToTicketOptions() {
  //external booking url
  if (props.event.externalBookingUrl) {
    window.open(props.event.externalBookingUrl, "_blank");
    return;
  }

  //direct to checkout if only one ticket type
  if (props.event.tickets.length === 1) {
    const route = useRoute();
    useCheckoutRedirect().redirectToCheckout({
      id: props.event.tickets[0].id,
      tenantId: props.event.tickets[0].tenantId,
      start: route.query.start,
      end: route.query.end,
    });
  } else {
    openTicketOptions.value = true;
  }
}
</script>
<style scoped>

</style>