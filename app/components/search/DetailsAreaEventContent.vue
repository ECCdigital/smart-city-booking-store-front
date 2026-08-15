<template>
  <div class="">
    <!-- Title -->
    <div class="md:flex justify-between">
      <div>
        <p class="text-sm font-bold text-primary">
          {{ getTenantName(item.tenantId) }}
        </p>
        <h2 class="text-2xl font-bold">{{ item?.information.name }}</h2>
      </div>
      <div class="grid content-center">
        <EventBookingButton
          v-if="currentEvent"
          :event="currentEvent"
          is-direct-connection
        />
      </div>
    </div>

    <div class="md:flex">
      <div class="md:mr-20 mb-10 basis-2/3">
        <EventTimeInformation :event="item" class="mt-5" />
        <EventsEventAdressInformation :event="item" class="mb-5" />

        <BookableFlagDisplay
          :flags="item?.information.flags"
          is-detail-mode
          class="my-5"
        />

        <!-- Description -->
        <div>
          <div class="line-clamp-3 md:line-clamp-none" v-html="htmlText" />
          <div class="flex justify-end md:hidden">
            <UButton
              label="Alles ansehen"
              variant="ghost"
              class="mt-2"
              @click="showFullDescription = true"
            />
          </div>

          <UModal
            v-model:open="showFullDescription"
            :title="'Beschreibung von ' + item?.information.name"
            size="lg"
            class="max-h-[80vh]"
            :ui="{ overlay: 'backdrop-blur-md' }"
          >
            <template #body>
              <div class="p-4" v-html="htmlText" />
            </template>
          </UModal>
        </div>

        <div class="mt-5">
          <span class="font-bold"> Veranstalter: </span>
          {{ item.eventOrganizer.name }}
        </div>
        <USeparator
          class="w-full my-5 md:my-10"
          :ui="{ border: 'border-gray-300' }"
        />

        <!-- Price Information & Map (sm-view) -->
        <PriceInformationArea is-event :item="item" class="md:hidden mb-2" />
        <AddressInformationArea is-event :item="item" class="md:hidden mb-5" />

        <!-- Availability -->
        <div>
          <h3 class="text-xl font-bold mb-5">Ticketoptionen & Verfügbarkeit</h3>
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
            class="bg-gray-200 dark:bg-gray-700 rounded-lg p-3 mb-2 flex content-center"
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
      </div>

      <!-- Price Information & Map -->
      <div class="basis-1/3 space-y-3 pt-2 md:pt-5">
        <AddressInformationArea is-event :item="item" class="hidden md:block" />
        <PriceInformationArea is-event :item="item" class="hidden md:block" />
      </div>
    </div>
  </div>
</template>
<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventInfoDisplay from "~/components/events/EventInfoDisplay.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventTicketStrip from "~/components/events/EventTicketStrip.vue";
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import InputDateTimePeriod from "~/components/inputs/InputDateTimePeriod.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCatalogQueryState } from "~/composables/search/useCatalogQueryState.js";
import { useBookableSearch } from "~/composables/search/useBookableSearch.js";
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

const { getTenantName } = useTenant();
const {
  updatedItems: events,
  runSearch,
  resetResults,
} = useBookableSearch({ isEvent: true, sourceItems: [props.item] });

const currentEvent = computed(() => {
  if (events.value.length === 1) {
    return events.value[0].item;
  }
  return props.item;
});
const tickets = computed(() => {
  if (currentEvent.value) {
    return currentEvent.value.tickets;
  }
  return props.item.tickets;
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlText = computed(() => {
  if (props.item.information.description) {
    return sanitizeHtml(props.item.information.description);
  }
  return sanitizeHtml(props.item.information.teaserText || "");
});
const showFullDescription = ref(false);

const hasTimeRelatedPrices = computed(() => {
  return props.item.tickets.some((ticket) =>
    ticket.priceCategories.some((c) => c.weekdays.length > 0),
  );
});

onMounted(async () => {
  if (timePeriod.value.start && timePeriod.value.end) {
    await runSearch({
      term: "",
      location: "",
      timeStart: timePeriod.value.start,
      timeEnd: timePeriod.value.end,
      isEvent: true,
    });
  }
});

const { contrastToPrimary } = useContrastColor();

async function setSearchTimePeriod(tp) {
  timePeriod.value = tp;
  await runSearch({
    term: "",
    location: "",
    timeStart: timePeriod.value.start,
    timeEnd: timePeriod.value.end,
    isEvent: false,
  });
}
function removeSearchTimePeriod() {
  timePeriod.value = null;
  resetResults();
}

function goToExternalCheckout() {
  window.open(props.item.externalBookingUrl, "_blank");
}
</script>
<style scoped></style>
