<template>
  <div class="container-md pb-15">
    <PageHeader
        title="Einstellungen"
        description="Verwalten Sie die Darstellung der Anwendung. Sie können beispielsweise
      zwischen einem hellen und einem dunklen Design wechseln. Optional können
      Sie auch die Sprache der Benutzeroberfläche anpassen."
    />
    <AppearanceSection />
  </div>
</template>
<script setup>
import AppearanceSection from "~/components/user/settings/AppearanceSection.vue";
import PageHeader from "~/components/PageHeader.vue";

definePageMeta({
  name: "appearance",
  layout: "panel",
  navigation: "settings",
  requiresAuth: true,
});
</script>
<style scoped>

</style>