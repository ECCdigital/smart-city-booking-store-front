<template>
  <div
    id="body"
    class="p-2 text-gray-800 dark:text-gray-100"
    :class="mapDetailMode? '': 'flex flex-wrap content-between h-full'"
  >
    <div class="w-full max-w-full min-w-0 overflow-hidden break-all">
      <!--<div :class="mapMode ? 'w-full max-w-full bg-blue-500 break-words overflow-hidden':'w-full'">-->
      <!-- Title -->
      <p
        class="font-bold whitespace-normal break-words"
        :class="hasLongTitle ? 'text-base line-clamp-3' : 'text-lg'"
      >
        {{ bookable.title }}
      </p>
      <p>{{ getTenantName(bookable.tenantId) }}</p>

      <!-- Adresse und Entfernung -->
      <div class="w-full" :class="mapDetailMode ? '' : 'my-5'">
        <BookableAdressInformation
          :bookable="bookable"
          show-distance
          class="whitespace-normal break-before-auto"
          :class="mapDetailMode? 'text-sm' : ''"
        />
      </div>
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-200' }"
      />

      <!-- Eigenschaften -->
      <div
        v-if="!mapDetailMode"
        class="w-full my-5 whitespace-normal break-words"
      >
        <BookableFlagDisplay v-if="bookable.flags" :flags="bookable.flags" />
      </div>
    </div>

    <!-- Preis -->
    <div
      v-if="!isNotSuitable"
      class="w-full flex justify-end text-md font-bold"
    >
      <BookablePriceDisplay
        v-if="!isNotSuitable"
        :bookable="bookable"
        :calculated-price="calculatedPrice"
      />
    </div>
  </div>
</template>
<script setup>
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import { useTenantStore } from "~~/stores/tenant.js";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  searchParams: {
    type: Object,
    default: null,
  },
  calculatedPrice: {
    type: Object,
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
  mapDetailMode: {
    type: Boolean,
    default: false,
  },
});

const { getTenantName } = useTenant();

const hasLongTitle = computed(() => {
  return (props.bookable?.title?.length ?? 0) > 60;
});
</script>

<style scoped></style>
