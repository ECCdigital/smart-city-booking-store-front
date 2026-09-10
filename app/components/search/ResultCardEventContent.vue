<template>
  <div class="flex flex-wrap content-between h-full p-2">
    <div class="w-full">
      <!-- Title -->
      <p class="font-bold" :class="hasLongTitle ? 'text-base line-clamp-3' : 'text-lg'">
        {{ event.information.name }}
      </p>
      <p>{{ getTenantName(event.tenantId) }}</p>

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
      v-if="!isNotSuitable"
      class="w-full flex flex-col justify-end text-md font-bold"
    >
      <EventPriceDisplay
        v-if="!isNotSuitable"
        :event-tickets="event.tickets"
        :is-free="event.attendees.free"
        class="grid place-content-end text-md font-bold mt-2"
      />
      <div class="flex justify-end mt-2">
        <UButton
          v-if="!isNotSuitable && !event.attendees.needsRegistration"
          label="Keine Anmeldung nötig"
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
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
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
