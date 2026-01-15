<template>
  <div class="">
  <!-- Title -->
  <div class="flex justify-between">
    <div>
      <p class="text-sm font-bold text-primary">
        {{ tenantName }}
      </p>
      <h2 class="text-2xl font-bold">{{ item?.information.name }}</h2>
    </div>
    <EventBookingButton v-if="currentEvent" :event="currentEvent" is-direct-connection/>

  </div>
    <div class="md:flex">
      <div class="md:mr-20 mb-10 basis-2/3">
        <EventTimeInformation :event="item" class="my-5" />

        <BookableFlagDisplay :flags="item?.information.flags" is-detail-mode class="my-5" />

        <div v-html="htmlText" />

        <div class="mt-5">
          <span class="font-bold">
            Veranstalter:
          </span>
          {{ item.eventOrganizer.name }}
        </div>
        <USeparator class="w-full my-10" :ui="{ border: 'border-gray-300' }" />

        <div>
          <h3 class="text-xl font-bold mb-5">Ticketoptionen & Verfügbarkeit</h3>
          <div v-if="hasTimeRelatedPrices">
            <UAlert
                v-if="!timePeriod || (!timePeriod.start && !timePeriod.end)"
                title="Wählen Sie Daten aus, um die Verfügbarkeit und Preise zu sehen."
                icon="i-lucide-info"
                variant="ghost"
                class="p-2 text-red-500"
            />
            <InputTimePeriod
                :time-period="timePeriod"
                class="border rounded-lg mt-2 mb-5"
                style="max-width: 500px; width: 400px"
                @select-date="setSearchTimePeriod"
                @remove-date="removeSearchTimePeriod"
            />
          </div>


          <!--externe Tickets -->
          <div v-if="item.externalBookingUrl" class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 mb-2 flex content-center">
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

          <!-- keine Tickets hinterlegt -->
          <EventInfoDisplay
              v-if="item.attendees.publicEvent && item.attendees.needsRegistration && item.tickets.length === 0"
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
      </div>

      <!-- toDo - add map view -->
      <div class="basis-1/3 space-y-3 pt-5">
        <AddressInformationArea is-event :item="item" />
        <PriceInformationArea is-event :item="item" />
      </div>
    </div>
</div>
</template>
<script setup>
import {useTenantStore} from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventInfoDisplay from "~/components/events/EventInfoDisplay.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventTicketStrip from "~/components/events/EventTicketStrip.vue";
import {useSanitizeHtml} from "~/composables/utils/useSanitizeHtml.js";
import InputTimePeriod from "~/components/inputs/InputTimePeriod.vue";
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import {useCatalogQueryState} from "~/composables/search/useCatalogQueryState.js";
import {useBookableSearch} from "~/composables/search/useBookableSearch.js";
import AddressInformationArea from "~/components/AddressInformationArea.vue";
import PriceInformationArea from "~/components/PriceInformationArea.vue";
import EventBookingButton from "~/components/events/EventBookingButton.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const { state: query } = useCatalogQueryState();
const timePeriod = ref({
  start: query.start,
  end: query.end,
});
const {
  updatedItems: events,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: true, sourceItems: [props.item] });

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.item.tenantId).name;
});
const currentEvent = computed(() => {
  if(events.value.length === 1){
    return events.value[0].item;
  }
  return props.item;
})
const tickets = computed(() => {
  if(currentEvent.value){
    return currentEvent.value.tickets;
  }
  return props.item.tickets;
})
const ticketAvailable = computed(() => {
  //toDo - ***********************************************
  // toDo - remaining beachten
  //toDo - ***********************************************
  if(currentEvent.value?.tickets && currentEvent.value.tickets.length <0){
    return false;
  }
  console.log(currentEvent.value)
  return true
})

const { sanitizeHtml } = useSanitizeHtml();
const htmlText = computed(() => {
  if(props.item.information.description){
    return sanitizeHtml(props.item.information.description);
  }
  return sanitizeHtml(props.item.information.teaserText || "");
});

const hasTimeRelatedPrices = computed(() => {
  return props.item.tickets.some((ticket) => ticket.priceCategories.length > 1);
});


onMounted(async () => {
  if (timePeriod.value.start && timePeriod.value.end) {
    await runSearch({
      term: '',
      location: '',
      timeStart: timePeriod.value.start,
      timeEnd: timePeriod.value.end,
      isEvent: true
    })
  }
});

const contrastToPrimary = computed(() =>
    useContrastColor().contrastToPrimary()
);

async function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
  await runSearch({
    term: '',
    location: '',
    timeStart: timePeriod.value.start,
    timeEnd: timePeriod.value.end,
    isEvent: false
  })
}
function removeSearchTimePeriod() {
  timePeriod.value = null;
  resetResults()
}

function goToExternalCheckout() {
  window.open(props.item.externalBookingUrl, "_blank");
}


</script>
<style scoped></style>