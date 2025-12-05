<template>
  <div class="basis-3/4 p-4 flex flex-col">
    <div>
      <!-- Title -->
      <p class="text-lg font-bold">
        {{ event.information.name }}
      </p>
      <p>{{ tenantName }}</p>

      <!-- Zeitpunkt, Adresse und Entfernung -->
      <div class="w-full my-5">
        <EventTimeInformation :event="event" class="w-full text-sm" />
        <EventAdressInformation :event="event" class="w-full text-sm" />
        <div class="my-5 line-clamp-3" v-html="htmlTeaserText" />
      </div>
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-300' }"
      />
    </div>

    <div class="flex h-full justify-between overflow-hidden">
      <!-- Veranstalter & Eigenschaften -->
      <div class="basis-3/5 w-full my-2">
        <p class="w-full my-2">Veranstalter: {{ event.eventOrganizer.name }}</p>
        <BookableFlagDisplay
          :flags="event.information.flags"
          class="line-clamp-3"
        />
      </div>

      <div class="basis-2/5 w-full grid content-end mt-4">
        <EventPriceDisplay
          v-if="!isNotBookable"
          :event-tickets="event.tickets"
          :is-free="event.attendees.free"
          class="grid place-content-end text-md font-bold mt-2"
        />

        <!--Aktionen-->
        <div class="w-full mt-2 flex justify-end content-end">
          <!-- toDo - für MVP ausgeblendet! Danach wieder aktivieren!  -->
          <!--<UButton
          v-if="!isNotBookable"
          label="Details ansehen"
          variant="ghost"
          class="justify-center px-10"
          :to="`/catalog/${catalogSlug}/events/${event.id}`"
        />
        -->
          <UTooltip :disabled="disableTooltip" :text="tooltipText">
            <div>
              <UButton
                v-if="!isNotBookable && event.attendees.needsRegistration"
                label="Buchen"
                :disabled="bookingDisabled"
                class="bookingButton justify-center px-10"
                :style="{ color: contrastToPrimary }"
                @click="goToTicketOptions"
              />
              <UButton
                v-if="!isNotBookable && !event.attendees.needsRegistration"
                label="Keine Anmeldung nötig"
                variant="soft"
                disabled
                class="bookingButton justify-center px-3"
              />
            </div>
          </UTooltip>
        </div>
      </div>
    </div>
    <EventTicketOptionsDialog
      v-model:open="openTicketOptions"
      :tickets="event.tickets"
      :is-private-event="isPrivateEvent"
      :registration-needed="event.attendees.needsRegistration"
    />
  </div>
</template>
<script setup>
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
import EventTicketOptionsDialog from "~/components/events/EventTicketOptionsDialog.vue";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import { useTenantStore } from "~~/stores/tenant.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  price: {
    type: Number,
    default: null,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "");
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.event.tenantId).name;
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
.bookingButton:disabled {
  background-color: #cccccc;
}
</style>
