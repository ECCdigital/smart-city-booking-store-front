<template>
  <div>
    <AppearanceSection />
  </div>
</template>
<script setup>
import AppearanceSection from "~/components/user/settings/AppearanceSection.vue";

definePageMeta({
  name: "tenant-appearance",
  layout: "settings",
  middleware: ["user-auth"],
});
</script>
<style scoped>

</style>