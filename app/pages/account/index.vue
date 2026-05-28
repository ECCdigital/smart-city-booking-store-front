<template>
  <div />
</template>
<script setup>
definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
  middleware: [
    () => navigateTo("/account/bookings", { replace: true }),
  ],
});
</script>

<style scoped></style>
