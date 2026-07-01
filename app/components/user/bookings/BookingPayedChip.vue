<template>
  <div
    v-if="bookingPayment"
    class="flex px-3 py-1 rounded-full text-xs font-medium"
    :class="bookingPayment.classes"
  >
    <UIcon :name="bookingPayment.icon" class="w-4 h-4 mr-1 mt-0.5" />
    {{ bookingPayment.label }}
  </div>
</template>
<script setup>
import { resolveBookingPaymentChip } from "~/utils/bookingPaymentStatus.js";

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const { t } = useI18n();

const bookingPayment = computed(() => resolveBookingPaymentChip(props.booking, t));
</script>
