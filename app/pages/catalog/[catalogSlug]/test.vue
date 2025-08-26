<script setup>
import { useAuth } from "~/composables/auth/useAuth.js";

definePageMeta({
  middleware: "auth",
  name: "test",
});

const { user } = useAuth();
</script>

<template>
  <div>
    <p style="color: var(--color-primary)">Testseite unter [...path]</p>
    {{ user }}
  </div>
</template>

<style scoped></style>
