<template>
  <div />
</template>
<script setup>
definePageMeta({
  name: "tenant-user",
  layout: "user",
  middleware: ["user-redirect", "user-auth"],
});
</script>

<style scoped></style>
