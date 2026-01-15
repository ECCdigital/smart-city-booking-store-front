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
          <UButton
          v-if="!isNotBookable"
          label="Details ansehen"
          :variant="entryPageMode? 'solid' : 'ghost'"
          class="justify-center px-10"
          :style="{ cursor:'pointer' }"
          @click="goToDetails()"
        />
          <EventBookingButton v-if="!entryPageMode" :event="event" />
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
import EventBookingButton from "~/components/events/EventBookingButton.vue";

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
  entryPageMode: {
    type: Boolean,
    default: false,
  },
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "");
});

const { tenantTo } = useTenantRoute();
const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.event.tenantId).name;
});

const isPrivateEvent = computed(() => {
  return !props.event.attendees.publicEvent || false;
});

const openTicketOptions = ref(false);

function goToDetails(){
  const router = useRouter();
  router.push(tenantTo(`events/${props.event.id}`));
}
</script>
<style scoped>
</style>
