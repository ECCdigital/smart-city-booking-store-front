<template>
  <div>
    <UBlogPost
        class="shadow-lg h-full bg-white dark:bg-gray-700"
        :class="isNotBookable ? 'opacity-70 dark:opacity-50' : ''"
        @click="goToCheckout"
    >

      <template #header>
        <div>
          <img
              v-if="event.information?.teaserImage"
              :src="`/api/img?url=${encodeURIComponent(event.information.teaserImage)}`"
              alt=""
          >
          <img
              v-else
              src="../../assets/bookable-default.jpg"
              alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          >
        </div>
      </template>

      <template #body>
        <div class="flex flex-wrap content-between h-full">
          <div class="w-full">
            <!-- Title -->
            <p class="text-lg font-bold">
              {{ event.information.title }}
            </p>
            <p>{{ tenantName }}</p>

            <!-- Adresse und Entfernung -->
            <div class="w-full my-5">
              <EventTimeInformation :event="event"/>
              <EventAdressInformation :event="event" />
            </div>
            <div
                class="my-5 line-clamp-3"
                v-html="htmlTeaserText"
            />
            <USeparator
                color="neutral"
                class="w-full"
                :ui="{ border: 'border-gray-200' }"
            />

          <!-- Veranstalter & Eigenschaften -->

            <div class="w-full my-2">
              <p>Veranstalter: {{event.eventOrganizer.name}}</p>
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
              class="grid place-content-end text-md font-bold mt-2"
              />
        </div>
        </div>
      </template>
    </UBlogPost>
  </div>
</template>
<script setup>
import {useSanitizeHtml} from "~/composables/utils/useSanitizeHtml.js";
import {useTenantStore} from "~~/stores/tenant.js";
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";

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


const { sanitizeHtml } = useSanitizeHtml()
const htmlTeaserText = computed(() => {
  return sanitizeHtml(props.event.information.teaserText || "")
})

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.event.tenantId).name;
});

function goToCheckout() {
  console.log("goToCheckout clicked for event id:", props.event.id);
  /*
  const config = useRuntimeConfig();
  const baseFromConfig =
    (config && config.public && config.public.adminBaseUrl) ||
    config.adminBaseUrl ||
    "";

  if (!baseFromConfig) {
    console.warn(
      "adminBaseUrl not set in runtime config; falling back to relative /checkout path",
    );
  }

  const base = baseFromConfig.replace(/\/$/, "") || ""; // remove trailing slash if present

  const params = new URLSearchParams({
    id: props.event.id,
    tenant: props.event.tenantId,
    amount: "1",
  });

  const url = base
    ? `${base}/checkout?${params.toString()}`
    : `/checkout?${params.toString()}`;

  if (typeof window !== "undefined") {
    const newWindow = window.open(url, "_blank");
    if (newWindow) {
      try {
        newWindow.opener = null; // enforce noopener
      } catch (e) {
        console.error(e);
        // ignore in case browser forbids
      }
    } else {
      window.location.href = url;
    }
  } else {
    console.warn("Attempted to open checkout URL on server-side: ", url);
  }
   */
}
</script>

<style scoped></style>
