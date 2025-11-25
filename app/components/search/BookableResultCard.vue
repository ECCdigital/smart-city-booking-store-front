<template>
  <div>
    <UBlogPost
      class="shadow-lg h-full bg-white dark:bg-gray-700"
      :class="isNotBookable ? 'opacity-70 dark:opacity-50' : ''"
      @click="goToCheckout"
    >
      <template #header>
        <div class="flex flex-col h-full">
          <div class="basis-full flex items-center h-9/10">
            <img
              v-if="bookable?.imgUrl"
              :src="`/api/img?url=${encodeURIComponent(bookable?.imgUrl)}`"
              alt="Bild des Buchungsobjekts"
              class="h-full w-full object-contain"
            >
            <img
              v-else
              src="../../assets/bookable-default.jpg"
              alt="Platzhalterbild: graue Dreiecke, keine spezifische Darstellung des Buchungsobjekts"
            >
          </div>
          <USeparator color="primary" type="solid" size="xl" class="w-full" />
        </div>
      </template>

      <template #body>
        <div class="flex flex-wrap content-between h-full">
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
    </UBlogPost>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import { useTenantStore } from "~~/stores/tenant.js";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
  calculatedPrice: {
    type: Number,
    default: null,
  },
  searchParams: {
    type: Object,
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
  if (!props.isNotBookable) {
    useCheckoutRedirect().redirectToCheckout(
      props.bookable.id,
      props.bookable.tenantId,
        props.searchParams?.searchTimePeriod?.start || null,
        props.searchParams?.searchTimePeriod?.end || null,
    );
  }
}
</script>

<style scoped></style>
