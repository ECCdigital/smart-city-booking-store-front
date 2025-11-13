<template>
  <div
    class="bg-gray-200 dark:bg-gray-700 flex flex-row rounded-xl"
    :class="props.isNotBookable ? 'opacity-70' : ''"
    style=""
  >
    <div class="basis-1/4">
      <img
        v-if="event.information?.teaserImage"
        :src="`/api/img?url=${encodeURIComponent(event.information.teaserImage)}`"
        alt=""
        class="rounded-xl h-full w-full object-cover"
      >
      <img
        v-else
        src="../../assets/bookable-default.jpg"
        alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
        class="rounded-xl h-full w-full object-cover"
      >
    </div>

    <div class="basis-3/4 p-4 flex flex-col justify-between">
      <div class="">
        <!-- Title -->
        <p class="text-lg font-bold">
          {{ event.information.name }}
        </p>
        <p>{{ tenantName }}</p>

        <!-- Zeitpunkt, Adresse und Entfernung -->
        <div class="w-full my-5">
          <EventTimeInformation :event="event" class="w-full text-sm" />
          <EventAdressInformation :event="event" class="w-full text-sm" />
          <div class="my-5" v-html="htmlTeaserText"/>
        </div>
        <USeparator
          color="neutral"
          class="w-full"
          :ui="{ border: 'border-gray-300' }"
        />

      </div>

      <div class="flex justify-between h-full">
       <!-- Veranstalter & Eigenschaften -->
        <div class="basis-3/5 w-full my-2">
          <div class="w-full my-2">
            <p>Veranstalter: {{event.eventOrganizer.name}}</p>
          </div>

          <UBadge
            v-for="(flag, i) in event.information.flags"
            :key="i"
            icon="i-lucide-check"
            size="md"
            color="neutral"
            variant="ghost"
            style="padding-left: 0; padding-right: 15px"
          >
            {{ flag }}
          </UBadge>
        </div>

        <div class="basis-2/5 w-full grid content-end">
          <EventPriceDisplay
              v-if="!isNotBookable"
              :event-tickets="event.tickets"
              class="grid place-content-end text-md font-bold mt-2"
          />

          <!--Aktionen-->
          <div class="w-full mt-2 flex justify-end content-end">
            <!-- toDo - für MVP ausgeblendet! Danach wieder aktivieren!  -->
            <!--<UButton
            v-if="!isNotBookable"
            label="Details ansehen"
            variant="ghost"
            class="justify-center px-10"
            :to="`/catalog/${catalogSlug}/locations/${bookable.id}`"
          />
          -->
            <UButton
              v-if="!isNotBookable"
              label="Buchen"
              class="justify-center px-10"
              :style="{ color: contrastToPrimary }"
              @click="goToCheckout"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import EventAdressInformation from "~/components/events/EventAdressInformation.vue";
import {useTenantStore} from "~~/stores/tenant.js";
import {useContrastColor} from "~/composables/utils/useContrastColor.js";
import EventTimeInformation from "~/components/events/EventTimeInformation.vue";
import {useSanitizeHtml} from "~/composables/utils/useSanitizeHtml.js";
import EventPriceDisplay from "~/components/events/EventPriceDisplay.vue";

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

const contrastToPrimary = computed(() =>
  useContrastColor().contrastToPrimary(),
);

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
