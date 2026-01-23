<template>
  <div
    class="bg-gray-200 dark:bg-gray-700 flex justify-between rounded-md p-2 mb-2"
  >
    <p class="text-lg basis-2/3 content-center">
      {{ props.ticket.title }}
    </p>
    <div :class="detailsMode? 'md:flex content-center space-x-1' :''">
      <div class="content-center">
        <BookablePriceDisplay
            :bookable="ticket"
            :calculated-price="ticket.calculatedPrice"
            class="grid place-content-end text-md font-bold"
        />
        <div v-if="ticket.priceValueAddedTax" class="text-gray-500 text-xs italic">
          (inkl. MwSt.)
        </div>

      </div>
      <div class="content-center">
        <UTooltip
            :disabled="ticketsAvailable"
            text="Dieser Tickettyp ist ausverkauft."
        >
          <UButton
              label="Buchen"
              class="justify-center px-5"
              :style="{ color: contrastToPrimary }"
              :disabled="!ticketsAvailable"
              @click="goToCheckout"
          />
        </UTooltip>
      </div>

    </div>
  </div>
</template>
<script setup>
import BookablePriceDisplay from "~/components/bookables/BookablePriceDisplay.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useCheckoutRedirect } from "~/composables/utils/useCheckoutRedirect.js";

const props = defineProps({
  ticket: {
    type: Object,
    required: true,
  },
  detailsMode: {
    type: Boolean,
    default: false,
  },
});
const ticketsAvailable = computed(
  () => props.ticket.availability?.remaining > 0 || true
);

const { contrastToPrimary } = useContrastColor();


function goToCheckout() {
  const route = useRoute();
  useCheckoutRedirect().redirectToCheckout({
    id: props.ticket.id,
    tenantId: props.ticket.tenantId,
    start: route.query.start,
    end: route.query.end,
  });
}
</script>

<style scoped></style>
