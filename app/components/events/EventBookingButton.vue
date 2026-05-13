<template>
  <div>
    <UTooltip
      v-if="event.attendees.needsRegistration"
      :show="bookingDisabled"
      :text="tooltipText"
    >
      <div class="h-full">
        <UButton
          :class="[
            isDirectConnection ? 'px-5 mt-5 md:my-0' : 'px-10',
            bookingDisabled
              ? 'bg-primary/60 cursor-not-allowed'
              : 'cursor-pointer',
          ]"
          :color="bookingDisabled ? '' : 'primary'"
          :disabled="bookingDisabled"
          :icon="isDirectConnection ? 'i-lucide-shopping-cart' : ''"
          :label="isDirectConnection ? 'Jetzt buchen' : 'Buchen'"
          :style="{
            color: bookingDisabled ? '' : contrastToPrimary,
          }"
          class="justify-center h-full"
          @click="goToTicketOptions"
        />
      </div>
    </UTooltip>
    <!-- no registration -->
    <UTooltip
      v-if="!event.attendees.needsRegistration"
      text="Dieses Event ist öffentlich und kann ohne Anmeldung besucht werden."
    >
      <UButton
        class="justify-center px-3 bg-primary/60 mt-5 md:my-0"
        color=""
        disabled
        label="Keine Anmeldung nötig"
      />
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
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
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
  isNotSuitable: {
    type: Boolean,
    default: false,
  },
  isNotBookable: {
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

const tooltipText = computed(() => {
  if (isPrivateEvent.value) {
    return "Das Event ist nicht öffentlich und kann nicht gebucht werden.";
  } else if (!hasEventTickets.value) {
    return "Für dieses Event sind keine Tickets verfügbar.";
  } else {
    return "";
  }
});

const { contrastToPrimary } = useContrastColor();

const bookingDisabled = computed(
  () =>
    props.event.attendees.needsRegistration &&
    (isPrivateEvent.value || !hasEventTickets.value),
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
      url: props.event.tickets[0].checkoutUrl,
    });
  } else {
    openTicketOptions.value = true;
  }
}
</script>
<style scoped></style>
