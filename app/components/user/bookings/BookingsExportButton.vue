<template>
  <div>
    <UButton
      label="Buchungen exportieren"
      icon="i-lucide-download"
      size="md"
      variant="solid"
      color="primary"
      @click="exportBookings"
    />
  </div>
</template>
<script setup>
import { useExportBookings } from "~/composables/export/useExportBookings.js";

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});

const { bookingsToExcel } = useExportBookings();
function exportBookings() {
  console.log("Exporting bookings:", props.bookings);
  bookingsToExcel(props.bookings);
}
</script>

<style scoped></style>
