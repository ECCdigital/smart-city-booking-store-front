<template>
  <div class="basis-3/4 p-4 flex flex-col justify-between gap-2">
    <div class="flex flex-col gap-2">
      <!-- Title -->
      <div class="cursor-pointer" @click="openDetails()">
        <p
          class="font-bold"
          :class="hasLongTitle ? 'text-base line-clamp-2' : 'text-lg'"
        >
          {{ event.information.name }}
        </p>
        <p>{{ getTenantName(event.tenantId) }}</p>
      </div>

      <!-- Zeitpunkt, Adresse und Entfernung -->
      <div class="w-full flex flex-col gap-1">
        <EventTimeInformation :event="event" class="w-full text-sm" />
        <EventAdressInformation
          :event="event"
          show-distance
          class="w-full text-sm"
        />
        <div
          v-if="hasTeaserText"
          class="line-clamp-3"
          v-html="htmlTeaserText"
        />
      </div>
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-300' }"
      />
    </div>

    <div class="flex gap-2 justify-between items-end">
      <!-- Veranstalter & Eigenschaften -->
      <div
        v-if="organizerName || hasFlags"
        class="basis-3/5 min-w-0 self-center flex flex-col gap-1"
      >
        <p v-if="organizerName" class="w-full">
          Veranstalter: {{ organizerName }}
        </p>
        <BookableFlagDisplay
          v-if="hasFlags"
          :flags="event.information.flags"
          class="line-clamp-3"
        />
      </div>

      <div class="basis-2/5 ml-auto grid content-end">
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
            variant="outline"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer' }"
            @click="openDetails"
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

const emit = defineEmits(["openDetails"]);

const { getTenantName } = useTenant();

const hasLongTitle = computed(() => {
  return (props.event?.information.name?.length ?? 0) > 60;
});

const { sanitizeHtml } = useSanitizeHtml();
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "");
});

// Markup alone is not content: an empty paragraph from the editor must not
// reserve three lines in the strip.
const hasTeaserText = computed(
  () =>
    htmlTeaserText.value
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, " ")
      .trim().length > 0,
);

const organizerName = computed(() => props.event?.eventOrganizer?.name || "");

const hasFlags = computed(
  () => (props.event?.information?.flags?.length ?? 0) > 0,
);

function openDetails() {
  emit("openDetails", props.event.id, "event");
}
</script>
<style scoped></style>
