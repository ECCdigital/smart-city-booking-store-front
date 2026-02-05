<template>
  <div>
    <BookingSection />
  </div>
</template>
<script setup>
import BookingSection from "~/components/user/BookingSection.vue";

definePageMeta({
  name: "bookings",
  layout: "user",
});
</script>



<style scoped>

</style>