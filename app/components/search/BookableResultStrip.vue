<template>
  <div>
    <div class="bg-gray-100 flex flex-row rounded-xl">
      <div class="basis-1/4">
        <img
          src="../../assets/example_office2.jpg"
          alt="Ein beispielhaftes Büro."
          class="rounded-xl h-full object-cover"
        />
      </div>
      <div class="basis-3/4 p-4">
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

        <div class="flex flex-row">
          <!-- Eigenschaften -->
          <div class="basis-3/4 w-full my-5">
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

          <!-- Preis -->
          <div class="basis-1/4 w-full flex justify-end grid content-center">
            <p
              v-if="
                !bookable.priceCategories ||
                bookable.priceCategories.length === 0
              "
            >
              Kein Preis festgelegt.
            </p>
            <p
              v-else-if="!bookable.priceCategories[0].priceEur"
              class="text-md font-bold"
            >
              Kostenlos
            </p>
            <p v-else class="text-md font-bold">
              € {{ bookable.priceCategories[0].priceEur }}
            </p>
            <!-- toDo - Funktion ergänzen, um komplexe Preise (und Angebote) anzuzeigen -->
          </div>
        </div>

        <!--Aktionen-->
        <div class="w-full mt-5 flex justify-end">
          <UButton
            label="Details ansehen"
            variant="ghost"
            class="justify-center px-10"
            :to="`/catalog/${catalogSlug}/locations/${bookable.id}`"
          />
          <UButton
            label="Buchen"
            class="justify-center text-white px-10"
            @click="onStartBooking"
          />
        </div>
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
      <!-- toDo - TESTING*************************************** -->
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
});

const route = useRoute();
const catalogSlug = computed(() => route.params.catalogSlug);

function onOpenDetails() {
  console.log("want to open details..");
}
function onStartBooking() {
  console.log("want to start booking..");
}
</script>

<style scoped></style>
