<template>
  <div class="basis-3/4 p-4 flex flex-col justify-between">
    <div>
      <!-- Title -->
      <p
        class="font-bold"
        :class="hasLongTitle ? 'text-base line-clamp-2' : 'text-lg'"
      >
        {{ bookable?.title }}
      </p>
      <p>{{ tenantName }}</p>

      <!-- Adresse und Entfernung -->
      <BookableAdressInformation
        :bookable="bookable"
        show-distance
        class="w-full"
        :class="mapMode ? 'text-sm my-1' : 'my-5'"
      />
      <USeparator
        v-if="!mapMode"
        color="neutral"
        class="w-full"
        :ui="{ border: 'border-gray-300' }"
      />
    </div>

    <div
      class="flex h-full"
      :class="mapMode ? 'justify-start' : 'overflow-hidden justify-between'"
    >
      <!-- Eigenschaften -->
      <div v-if="!mapMode" class="basis-3/5 w-full my-2">
        <BookableFlagDisplay :flags="bookable?.flags" class="line-clamp-3" />
      </div>

      <div class="w-full content-end" :class="mapMode ? '' : 'basis-2/5 grid '">
        <!-- Preis -->
        <BookablePriceDisplay
          v-if="!isNotBookable && !isNotSuitable"
          :bookable="bookable"
          :calculated-price="calculatedPrice"
          :is-map-stripe="mapMode"
          class="font-bold"
        />

        <!--Aktionen-->
        <div
          v-if="!entryPageMode && !mapMode"
          class="w-full mt-2 flex justify-end content-end gap-2"
        >
          <UButton
            label="Details ansehen"
            variant="outline"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer' }"
            @click="goToDetails(bookable.id, bookable.type)"
          />
          <UTooltip
            :show="isNotBookable"
            text="Prüfen Sie zur Buchung die Optionen in den Details."
          >
            <UButton
              v-if="!isNotSuitable && !entryPageMode"
              label="Buchen"
              class="justify-center px-10"
              :disabled="isNotBookable"
              :style="{
                color: contrastToPrimary,
                cursor: isNotBookable ? '' : 'pointer',
              }"
              @click="goToCheckout"
            />
          </UTooltip>
        </div>

        <div
          v-else-if="!mapMode"
          class="w-full mt-2 flex justify-end content-end gap-2"
        >
          <UButton
            v-if="!isNotBookable"
            label="Details ansehen"
            variant="solid"
            class="justify-center px-10 text-color-dark dark:text-color-light"
            :style="{ cursor: 'pointer', color: contrastToPrimary }"
            @click="goToDetails(bookable.id, bookable.type)"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useTenantStore } from "~~/stores/tenant.js";
import BookableAdressInformation from "~/components/bookables/BookableAdressInformation.vue";
import BookableFlagDisplay from "~/components/bookables/BookableFlagDisplay.vue";
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";
import { useRedirection } from "~/composables/utils/useRedirection.js";

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
  mapMode: {
    type: Boolean,
    default: false,
  },
});

const hasLongTitle = computed(() => {
  return (props.bookable?.title?.length ?? 0) > 60;
});

const tenantName = computed(() => {
  return useTenantStore().getTenantById(props.bookable.tenantId).name;
});

const { goToDetails } = useRedirection();

const { contrastToPrimary } = useContrastColor();

function goToCheckout() {
  const route = useRoute();
  useCheckoutRedirect().redirectToCheckout({
    id: props.bookable.id,
    tenantId: props.bookable.tenantId,
    start: route.query.start,
    end: route.query.end,
    url: props.bookable.checkoutUrl,
  });
}
</script>
<style scoped></style>
