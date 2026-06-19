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
  layout: "panel",
  navigation: "settings",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountSettings"));

const authStore = useAuthStore();
const user = computed(() => authStore.getUser);
</script>
<style scoped></style>
