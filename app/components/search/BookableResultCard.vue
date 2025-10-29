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
            src="../../assets/example_office2.jpg"
            alt="Ein beispielhaftes Büro."
          >
        </div>
      </template>
      <template #body>
        <div class="flex flex-wrap content-between h-full">
          <div class="w-full">
            <!-- Title -->
            <p class="text-lg font-bold">
              {{ bookable.title }}
            </p>
            <p>{{ bookable.tenantId }}</p>

            <!-- Adresse und Entfernung -->
            <div class="w-full my-5">
              <p>
                <UIcon name="i-lucide-map-pin" class="size-5" />
                <span v-if="bookable.location" class="p-3">{{
                  bookable.location
                }}</span>
                <span v-else class="italic p-3">Keine Adresse bekannt.</span>
              </p>
              <p v-if="bookable.location">
                <UIcon name="i-lucide-navigation" class="size-5" />
                <span class="p-3">Distance coming soon </span>
              </p>
            </div>
            <USeparator
              color="neutral"
              class="w-full"
              :ui="{ border: 'border-gray-200' }"
            />

            <!-- Eigenschaften -->
            <div class="w-full my-5">
              <UBadge
                v-for="(flag, i) in bookable.flags"
                :key="i"
                icon="i-lucide-check"
                size="md"
                color="neutral"
                variant="ghost"
                style="padding-left: 0; padding-right: 15px"
                >{{ flag }}</UBadge
              >
            </div>
          </div>

          <!-- Preis -->
          <div
            v-if="!isNotBookable"
            class="w-full flex justify-end text-md font-bold"
          >
            <BookablePriceDisplay :price="price" />
          </div>

          <!-- toDo - TESTING***************************************-->
          <!--
          <div class="bg-yellow-400 flex-wrap text-xs p-2">
            isOpeningHoursRelated: {{ bookable.isOpeningHoursRelated }}
            <hr />
            isScheduleRelated: {{ bookable.isScheduleRelated }}
            <hr />
            isSpecialOpeningHoursRelated:
            {{ bookable.isSpecialOpeningHoursRelated }}
            <hr />
            isTimePeriodRelated: {{ bookable.isTimePeriodRelated }}
            <hr />
            <hr />
            maxBooingDuration: {{ bookable.maxBookingDuration }}
            <hr />
            minBooingDuration: {{ bookable.minBookingDuration }}
            <hr />
            <hr />
            openingHours. {{ bookable.openingHours }}
            <hr />
            specialOpeningHours: {{ bookable.specialOpeningHours }}
            <hr />
            <hr />
            timePeriods: {{ bookable.timePeriods }}
          </div>
          -->
          <!-- toDo - TESTING***************************************-->
        </div>
      </template>
    </UBlogPost>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";

const props = defineProps({
  bookable: {
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

function displayPrice(price) {
  if (!price) {
    return "Kein Preis bekannt.";
  } else {
    return "€ " + price.toString().replace(/\./g, ",");
  }
}

function goToCheckout() {
  if (!props.isNotBookable) {
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
          // ignore in case browser forbids
        }
      } else {
        window.location.href = url;
      }
    } else {
      console.warn("Attempted to open checkout URL on server-side: ", url);
    }
  }
}
</script>

<style scoped></style>
