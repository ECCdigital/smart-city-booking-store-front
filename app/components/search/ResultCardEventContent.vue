<template>
  <!--
    The compact form (map tooltip, pin carousel, mobile sheet) is the bookable
    card's: name, provider, the time line, the place and the price in a box
    of fixed height. The full card adds teaser, organiser and flags.
  -->
  <div
    id="body"
    class="p-2 text-gray-800 dark:text-gray-100"
    :class="mapDetailMode ? 'flex flex-col h-full min-h-0' : 'flex flex-wrap content-between h-full'"
  >
    <div v-if="mapDetailMode" class="w-full min-w-0">
      <p class="font-bold text-base line-clamp-2">
        {{ event.information.name }}
      </p>
      <p class="text-sm">{{ getTenantName(event.tenantId) }}</p>
      <EventTimeInformation :event="event" class="text-sm mt-1" />
      <AddressInformation :item="event" class="text-sm" />
    </div>
    <div v-else class="w-full">
      <!-- Title -->
      <p class="font-bold" :class="hasLongTitle ? 'text-base line-clamp-3' : 'text-lg'">
        {{ event.information.name }}
      </p>
      <p>{{ getTenantName(event.tenantId) }}</p>

      <!-- Adresse und Entfernung -->
      <div class="w-full my-5">
        <EventTimeInformation :event="event" />
        <AddressInformation :item="event" />
      </div>
      <div class="my-5 line-clamp-3" v-html="htmlTeaserText" />
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-200' }"
      />
      <!-- Veranstalter & Eigenschaften -->

      <div class="w-full my-2">
        <p>{{ $t("bookableDetail.organiser") }} {{ event.eventOrganizer.name }}</p>
      </div>
      <div class="w-full my-5">
        <BookableFlagDisplay :flags="event.information.flags" />
      </div>
    </div>

    <!-- Preis -->
    <div
      v-if="!isNotSuitable"
      class="w-full flex flex-col justify-end text-md font-bold"
      :class="mapDetailMode ? 'mt-auto' : ''"
    >
      <EventPriceDisplay
        v-if="!isNotSuitable"
        :event-tickets="event.tickets"
        :is-free="event.attendees.free"
        class="grid place-content-end text-md font-bold mt-2"
      />
      <div v-if="!mapDetailMode" class="flex justify-end mt-2">
        <UButton
          v-if="!isNotSuitable && !event.attendees.needsRegistration"
          :label="$t('events.noRegistrationNeeded')"
          variant="soft"
          disabled
          class="justify-center px-3 text-color-dark dark:text-color-light"
        />
      </div>
    </div>
    <EventTicketOptionsDialog
      v-model:open="openTicketOptions"
      :tickets="event.tickets"
      :registration-needed="event.attendees.needsRegistration"
    />
  </div>
</template>
<script setup>
import { useSanitizeHtml } from "~/composables/utils/useSanitizeHtml.js";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import AddressInformation from "~/components/AddressInformation.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";
import EventTicketOptionsDialog from "~/components/events/EventTicketOptionsDialog.vue";


const openTicketOptions = defineModel("openTicketOptions", { type: Boolean });
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
  isNotSuitable: {
    type: Boolean,
    default: false,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
  entryPageMode: {
    type: Boolean,
    default: false,
  },
  mapDetailMode: {
    type: Boolean,
    default: false,
  },
});

const { getTenantName } = useTenant();
const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "");
});

const hasLongTitle = computed(() => {
  return (props.event?.information.name?.length ?? 0) > 60;
});
</script>

<style scoped></style>
