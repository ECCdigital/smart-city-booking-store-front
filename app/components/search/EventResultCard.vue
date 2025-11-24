<template>
  <div>
    <UBlogPost
      class="shadow-lg h-full bg-white dark:bg-gray-700"
      :class="isNotBookable ? 'opacity-70 dark:opacity-50' : ''"
      @click="goToTicketOptions"
    >
      <template #header>
        <div class="flex flex-col h-full">
          <div class="basis-full flex items-center h-9/10">
            <img
              v-if="event.information?.teaserImage"
              :src="`/api/img?url=${encodeURIComponent(event.information.teaserImage)}`"
              alt=""
              class="h-full w-full object-contain"
            >
            <img
              v-else
              src="../../assets/bookable-default.jpg"
              alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
            >
          </div>
          <USeparator color="primary" type="solid" size="xl" class="w-full" />
        </div>
      </template>

      <template #body>
        <div class="flex flex-wrap content-between h-full">
          <div class="w-full">
            <!-- Title -->
            <p class="text-lg font-bold">
              {{ event.information.name }}
            </p>
            <p>{{ tenantName }}</p>

            <!-- Adresse und Entfernung -->
            <div class="w-full my-5">
              <EventTimeInformation :event="event" />
              <EventAdressInformation :event="event" />
            </div>
            <div class="my-5 line-clamp-3" v-html="htmlTeaserText" />
            <USeparator
              color="neutral"
              class="w-full"
              :ui="{ border: 'border-gray-200' }"
            />

            <!-- Veranstalter & Eigenschaften -->

            <div class="w-full my-2">
              <p>Veranstalter: {{ event.eventOrganizer.name }}</p>
            </div>
            <div class="w-full my-5">
              <BookableFlagDisplay :flags="event.information.flags" />
            </div>
          </div>
          <!-- Preis -->
          <div
            v-if="!isNotBookable"
            class="w-full flex justify-end text-md font-bold"
          >
            <EventPriceDisplay
              v-if="!isNotBookable"
              :event-tickets="event.tickets"
              :is-free="event.attendees.free"
              class="grid place-content-end text-md font-bold mt-2"
            />
          </div>
        </div>
      </template>
    </UBlogPost>
    <EventTicketOptionsDialog
      v-model:open="openTicketOptions"
      :tickets="event.tickets"
      :is-private-event="isPrivateEvent"
      :registration-needed="event.attendees.needsRegistration"
    />
  </div>
</template>
<script setup>
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import { useTenantStore } from "~~/stores/tenant.js";
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventTicketOptionsDialog from "~/components/events/EventTicketOptionsDialog.vue";
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

const openTicketOptions = ref(false);
function goToTicketOptions() {
  console.log("Opening ticket options dialog for", props.event);

  //external booking url
  if (props.event.externalBookingUrl) {
    window.open(props.event.externalBookingUrl, "_blank");
    return;
  }

  //direct to checkout if only one ticket type
  if (props.event.tickets.length === 1) {
    useCheckoutRedirect().redirectToCheckout(
      props.event.tickets[0].id,
      props.event.tickets[0].tenantId,
    );
  } else {
    openTicketOptions.value = true;
  }
}
</script>

<style scoped></style>
