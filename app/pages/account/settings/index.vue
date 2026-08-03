<template>
  <div class="w-full container-md pb-24">
    <PageHeader title="Einstellungen" class="mb-5" />

    <SettingsSection v-if="user" :user="user" />

    <AppearanceSection class="my-5" />
  </div>
</template>
<script setup>
import SettingsSection from "~/components/user/settings/SettingsSection.vue";
import { useAuthStore } from "~~/stores/auth.js";
import PageHeader from "~/components/PageHeader.vue";
import AppearanceSection from "~/components/user/settings/AppearanceSection.vue";

definePageMeta({
  layout: "panel",
  navigation: "user",
  requiresAuth: true,
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.accountSettings"));

const authStore = useAuthStore();
const user = computed(() => authStore.getUser);
</script>
<style scoped></style>
