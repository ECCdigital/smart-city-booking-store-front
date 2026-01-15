<template>
  <div id="body" class="flex flex-wrap content-between h-full p-2">
    <div class="w-full">
      <!-- Title -->
      <p class="text-lg font-bold">
        {{ bookable.title }}
      </p>
      <p>{{ tenantName }}</p>

      <!-- Adresse und Entfernung -->
      <div class="w-full my-5">
        <BookableAdressInformation :bookable="bookable" />
      </div>
      <USeparator
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-200' }"
      />

      <!-- Eigenschaften -->
      <div class="w-full my-5">
        <BookableFlagDisplay :flags="bookable?.flags" />
      </div>
    </div>

    <!-- Preis -->
    <div
      v-if="!isNotBookable"
      class="w-full flex justify-end text-md font-bold"
    >
      <BookablePriceDisplay
        v-if="!isNotBookable"
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
  isNotBookable: {
    type: Boolean,
    default: false,
  },
  entryPageMode: {
    type: Boolean,
    default: false,
  },
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.bookable.tenantId).name;
});
</script>

<style scoped></style>
