<template>
  <UTooltip :disabled="!bookingStatus.tooltip" :text="bookingStatus.tooltip">
    <div
      class="flex items-center px-3 py-1 rounded-full text-xs font-medium"
      :class="[bookingStatus.color, bookingStatus.tooltip ? 'cursor-help' : '']"
    >
      <UIcon :name="bookingStatus.icon" class="w-4 h-4 mr-1" />
      {{ bookingStatus.label }}
    </div>
  </UTooltip>
</template>
<script setup>
import { resolveBookingStatusChip } from "~/utils/bookingStatus.js";

const { t } = useI18n();

const props = defineProps({
  booking: {
    type: Object,
    required: true,
  },
});

const bookingStatus = computed(() =>
  resolveBookingStatusChip(props.booking, t),
);
</script>

<style scoped></style>
