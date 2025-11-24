<template>
  <div
    class="bg-gray-200 dark:bg-gray-700 flex justify-between rounded-md p-2 mb-2"
  >
    <p class="text-lg basis-2/3 content-center ">
      {{ props.ticket.title }}
    </p>
    <div>
      <BookablePriceDisplay
        :bookable="ticket"
        class="grid place-content-end text-md font-bold"
      />
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
});
const ticketsAvailable = computed(
  () => props.ticket.availability?.remaining > 0 || true,
);

const contrastToPrimary = computed(() =>
  useContrastColor().contrastToPrimary(),
);

function goToCheckout() {
  useCheckoutRedirect().redirectToCheckout(
    props.ticket.id,
    props.ticket.tenantId,
  );
}
</script>

<style scoped></style>
