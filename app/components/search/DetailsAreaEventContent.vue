<template>
<div class="mr-20">
  <!-- Title -->
  <p class="text-sm font-bold text-primary">
    {{ tenantName }}
  </p>
  <h2 class="text-2xl font-bold">{{ item?.information.name }}</h2>

  <EventTimeInformation :event="item" class="my-5" />

  <BookableFlagDisplay :flags="item?.information.flags" is-detail-mode class="my-5" />

  <div v-html="htmlTeaserText" />

  <div class="mt-5">
    <span class="font-bold">
      Veranstalter:
    </span>
    {{ item.eventOrganizer.name }}
  </div>
  <USeparator class="w-full my-10" :ui="{ border: 'border-gray-300' }" />

  <div>
    <h3 class="text-xl font-bold">Ticketoptionen</h3>

    <!--externe Tickets -->
    <div v-if="item.externalBookingUrl" class="bg-gray-300 rounded-lg p-3 mb-2 flex content-center">
      <span class="font-bold mr-1 content-center ">{{ item?.information.name }}</span>
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
    
    <!-- toDo - Hinweis wenn keine Tickets hinterlegt sind -->
    <EventInfoDisplay
        v-if="item.attendees.publicEvent && item.attendees.needsRegistration && item.tickets.length === 0"
        title="Keine Tickets verfügbar."
        description="Für dieses Event sind derzeit keine Ticketoptionen hinterlegt."
    />
    

    <!-- toDo - Auflistung der Ticketoptionen -->
    <EventTicketStrip
        v-for="(ticket, i) in props.item.tickets"
        :key="i"
        :ticket="ticket"
        details-mode
    />

  </div>



  <!-- toDo - *** *** *** *** TESTING SPACE *** *** *** *** -->
  <!--
  <div class="bg-amber-100">
   {{props.item}}
 </div>
 <!-v class="bg-amber-200">
   {{ item.attendees.publicEvent }} ***
 </div>
 <div class="bg-amber-300">
   ...
 </div>
 -->
</div>
</template>
<script setup>
import {useTenantStore} from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventInfoDisplay from "~/components/events/EventInfoDisplay.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventTicketStrip from "~/components/events/EventTicketStrip.vue";
import {useSanitizeHtml} from "~/composables/utils/useSanitizeHtml.js";


const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.item.information.teaserText || "");
});
/*const { state: query } = useCatalogQueryState();
const {
  updatedItems: searchedEvents,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: false, sourceItems: [props.item] });


const isBookable = computed(() => {
  if(searchedItems.value[0].status === 'bookable'){return true}
  else if(searchedItems.value[0].status === 'suitable'){return true}
  return false
})
const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary()
);
*/

function goToExternalCheckout() {
  window.open(props.item.externalBookingUrl, "_blank");
}

</script>
<style scoped></style>