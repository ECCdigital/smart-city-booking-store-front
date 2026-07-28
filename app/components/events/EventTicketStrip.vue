<template>
  <div
    class="flex justify-between items-center bg-white dark:bg-gray-700 rounded-lg shadow-sm px-4 py-2 border border-gray-200 dark:border-gray-500 min-w-[250px]"
  >
    <p class="text-semibold basis-2/3 content-center">
      {{ props.ticket.title }}
    </p>
    <div :class="detailsMode ? 'md:flex content-center space-x-2' : ''">
      <div class="content-center">
        <BookablePriceDisplay
          :bookable="ticket"
          :calculated-price="ticket.calculatedPrice"
          class="grid place-content-end text-md font-bold"
        />
      </div>
      <div class="flex md:block justify-end md:content-center">
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
  () => props.ticket.availability?.remaining > 0 || true,
);

const { contrastToPrimary } = useContrastColor();

function goToCheckout() {
  const route = useRoute();
  useCheckoutRedirect().redirectToCheckout({
    id: props.ticket.id,
    tenantId: props.ticket.tenantId,
    start: route.query.start,
    end: route.query.end,
    url: props.ticket.checkoutUrl,
  });
}
</script>

<style scoped></style>
