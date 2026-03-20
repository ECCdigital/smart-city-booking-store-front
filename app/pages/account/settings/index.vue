<template>
  <div class="w-full container-md">
    <PageHeader
      title="Einstellungen"
      description="Verwalten Sie Ihre persönlichen Angaben. Sie haben außerdem die
      Möglichkeit, Ihr Passwort zu ändern."
    />

    <SettingsSection v-if="user" :user="user" />
  </div>
</template>
<script setup>
import SettingsSection from "~/components/user/settings/SettingsSection.vue";
import { useAuthStore } from "~~/stores/auth.js";
import PageHeader from "~/components/PageHeader.vue";

definePageMeta({
  name: "settings",
  layout: "panel",
  navigation: "settings",
  requiresAuth: true,
});

const authStore = useAuthStore();
const user = computed(() => authStore.getUser);
</script>
<style scoped></style>
