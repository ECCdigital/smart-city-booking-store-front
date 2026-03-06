<template>
  <div class="basis-3/4 p-4 flex flex-col">
    <div>
      <!-- Title -->
      <p
        class="font-bold"
        :class="hasLongTitle ? 'text-base line-clamp-2' : 'text-lg'"
      >
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
          v-if="!isNotBookable && !isNotSuitable"
          :event-tickets="event.tickets"
          :is-free="event.attendees.free"
          class="grid place-content-end text-md font-bold mt-2"
        />

        <!--Aktionen-->
        <div class="w-full mt-2 flex justify-end content-end gap-2">
          <UButton
            label="Details ansehen"
            variant="ghost"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer' }"
            @click="goToDetails()"
          />
          <EventBookingButton
            v-if="!isNotSuitable && event"
            :event="event"
            :is-not-bookable="isNotBookable"
            :is-not-suitable="isNotSuitable"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
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

const hasLongTitle = computed(() => {
  return (props.event?.information.name?.length ?? 0) > 60;
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "");
});

const { tenantTo } = useTenantRoute();
const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.event.tenantId).name;
});

function goToDetails() {
  const router = useRouter();
  router.push(tenantTo(`events/${props.event.id}`));
}
</script>
<style scoped></style>
