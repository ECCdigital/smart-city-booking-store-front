<script setup>
import { useAuth } from "~/composables/auth/useAuth.js";

definePageMeta({
  middleware: "auth",
});

const { t } = useI18n();
usePageTitle(() => t("meta.pages.home"));

const { user } = useAuth();
</script>

<template>
  <div>
    <p style="color: var(--color-primary)">Testseite unter [...path]</p>
    {{ user }}
  </div>
</template>

<style scoped></style>
