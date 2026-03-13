<template>
  <div class="w-full">
    <PageHeader
        title="Ihre Schlüssel"
        description="Hier finden Sie Ihre aktiven Buchungen mit IFBS-Schließsystem Zugriff."
        class="mb-3 md:mb-0"
    />

    <KeySection />
  </div>
</template>
<script setup >
import KeySection from "~/components/mobileKey/KeySection.vue";

definePageMeta({
  name: "tenant-keys",
  layout: "user",
  middleware: ["user-auth"],
});
</script>


<style scoped>

</style>