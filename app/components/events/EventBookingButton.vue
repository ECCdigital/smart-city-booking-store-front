<template>
  <div>
    <UTooltip :disabled="disableTooltip" :text="tooltipText">
      <div class="h-full">
        <UButton
            v-if="!isNotBookable && event.attendees.needsRegistration"
            :label="isDirectConnection ? 'Jetzt buchen' : 'Buchen'"
            :icon="isDirectConnection ? 'i-lucide-shopping-cart' : ''"
            :disabled="bookingDisabled"
            :color="bookingDisabled? '' : 'primary'"
            class="bookingButton justify-center h-full"
            :class="[
                isDirectConnection? 'px-5' : 'px-10',
                bookingDisabled? 'bg-gray-400/30 dark:bg-gray-200/40 text-gray-800 dark:text-gray-900' : ''
                ]"
            :style="{cursor: bookingDisabled? 'not-allowed' : 'pointer', color: bookingDisabled? '' : contrastToPrimary }"
            @click="goToTicketOptions"
        />
        <UButton
            v-if="!isNotBookable && !event.attendees.needsRegistration"
            label="Keine Anmeldung nötig"
            color=""
            disabled
            class="bookingButton justify-center px-3 bg-gray-400/30 dark:bg-gray-200/40 text-gray-800 dark:text-gray-900"
        />
      </div>
    </UTooltip>
    <EventTicketOptionsDialog
        v-model:open="openTicketOptions"
        :tickets="event.tickets"
        :is-private-event="isPrivateEvent"
        :registration-needed="event.attendees.needsRegistration"
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