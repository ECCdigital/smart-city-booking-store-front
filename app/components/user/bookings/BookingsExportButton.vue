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

const props = defineProps({
  bookings: {
    type: Array,
    required: true,
  },
});

function exportBookings() {
  console.log("Exporting bookings:", props.bookings);
}
</script>

<style scoped></style>
