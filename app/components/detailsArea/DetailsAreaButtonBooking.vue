<template>
  <UButton
    v-if="item.isBookable && !isEvent"
    :label="$t('bookableDetail.bookNow')"
    icon="i-lucide-shopping-cart"
    class="justify-center px-5"
    :style="{ color: contrastToPrimary, cursor: 'pointer' }"
    @click="goToCheckout()"
  />
  <EventBookingButton v-if="isEvent" :event="item" is-direct-connection />
</template>
<script setup>
import { useBookableDetailContent } from "~/composables/bookables/useBookableDetailContent.js";
import EventBookingButton from "~/components/events/EventBookingButton.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const { contrastToPrimary, goToCheckout } = useBookableDetailContent(
  () => props.item,
  props.isEvent,
);
</script>

<style scoped></style>
