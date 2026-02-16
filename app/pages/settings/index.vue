<template>
  <div>
    <SettingsSection v-if="user" :user="user"/>
  </div>
</template>
<script setup>
import SettingsSection from "~/components/user/settings/SettingsSection.vue";
import { useAuthStore } from "~~/stores/auth.js";

definePageMeta({
  name: "settings",
  layout: "settings",
  middleware: ["user-auth"],
});

const authStore = useAuthStore();
const user = computed(() => authStore.getUser);
</script>
<style scoped>

</style>