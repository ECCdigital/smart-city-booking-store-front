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
  middleware: ["user-auth"],
});
</script>

<style scoped>

</style>