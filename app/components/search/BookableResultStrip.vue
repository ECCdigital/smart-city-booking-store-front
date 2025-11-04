<template>
  <div>
    <div
      class="bg-gray-200 dark:bg-gray-700 flex flex-row rounded-xl"
      :class="isNotBookable ? 'opacity-70' : ''"
      style="height: 300px"
    >
      <div class="basis-1/5">
        <img
          v-if="bookable.imgUrl"
          :src="`/api/img?url=${encodeURIComponent(bookable.imgUrl)}`"
          alt="Bild des Buchungsobjekts"
          class="rounded-xl h-full object-cover"
        >
        <img
          v-else
          src="../../assets/bookable-default.jpg"
          alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
          class="rounded-xl h-full object-cover"
        >
      </div>
      <div class="basis-4/5 p-4 flex flex-col justify-between">
        <div class="">
          <!-- Title -->
          <p class="text-lg font-bold">
            {{ bookable.title }}
          </p>
          <p>{{ tenantName }}</p>
          <!-- toDo - change to name!!! -->

          <!-- Adresse und Entfernung -->
          <BookableAdressInformation :bookable="bookable" class="w-full my-5" />
          <USeparator
            color="neutral"
            class="w-full"
            :ui="{ border: 'border-gray-300' }"
          />
        </div>
        <div class="flex justify-between h-full">
          <!-- Eigenschaften -->
          <div class="basis-3/4 w-full my-2">
            <UBadge
              v-for="(flag, i) in bookable.flags"
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
          <div class="basis-1/4 w-full grid content-end">
            <!-- Preis -->
            <BookablePriceDisplay
              v-if="!isNotBookable"
              :bookable="bookable"
              :calculated-price="calculatedPrice"
              class="grid place-content-end text-md font-bold"
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
                class="justify-center text-white dark:text-black px-10"
                @click="goToCheckout"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- toDo - TESTING***************************************-->
      <!--
      <div class="bg-yellow-400 flex-wrap text-xs p-2">

        isOpeningHoursRelated: {{ bookable.isOpeningHoursRelated }}
        <hr >
        isScheduleRelated: {{ bookable.isScheduleRelated }}
        <hr >
        isSpecialOpeningHoursRelated:
        {{ bookable.isSpecialOpeningHoursRelated }}
        <hr >
        isTimePeriodRelated: {{ bookable.isTimePeriodRelated }}
        <hr >
        <hr >
        maxBooingDuration: {{ bookable.maxBookingDuration }}
        <hr >
        minBooingDuration: {{ bookable.minBookingDuration }}
        <hr >
        <hr >

        openingHours. {{ bookable.openingHours }}
        <hr >
        specialOpeningHours: {{ bookable.specialOpeningHours }}
        <hr >
        <hr >
        timePeriods: {{ bookable.timePeriods }}
      </div>
      -->
      <!-- toDo - TESTING*************************************** -->
    </div>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import { useTenantStore } from "~~/stores/tenant.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Number,
    default: null,
  },
  isNotBookable: {
    type: Boolean,
    default: false,
  },
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.bookable.tenantId).name;
});

function goToCheckout() {
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
    id: props.bookable.id,
    tenant: props.bookable.tenantId,
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
}
</script>

<style scoped></style>
