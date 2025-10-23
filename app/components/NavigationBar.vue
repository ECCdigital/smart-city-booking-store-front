<template>
  <div :class="barClass">
    <div v-for="(tab, k) in tabs" :key="k">
      <NavigationLink :tab="tab" />
    </div>
    <div style="flex: 1"></div>
    <UButton
      label="Anmelden"
      variant="ghost"
      class="px-4 text-white"
      to="/login"
      @click="console.log('want login')"
    />
    <UButton
      v-if="isGreaterThanSm"
      label="Registrieren"
      class="px-4 text-black bg-white"
      to="/register"
      @click="console.log('want register')"
    />
    <!-- toDo - https://ui.nuxt.com/docs/components/field-group (with dropdown) -->
  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";
import { useWindowSize } from "@vueuse/core";
import { useBreakpointCheck } from "../composables/utils/useBreakpointCheck.js";

const tabs = computed(() => [
  {
    label: "Orte",
    icon: "i-heroicons-map-pin",
    value: `/locations`,
  },
  {
    label: "Events",
    icon: "i-heroicons-calendar",
    value: `/events`,
  },
  {
    label: "Geräte",
    icon: "i-heroicons-wrench-screwdriver",
    value: `/bookables`,
  },
]);

const isGreaterThanSm = computed(() => useBreakpointCheck().isGreaterThanSm());

const barClass = computed(() => [
  "flex items-center bg-[var(--color-secondary)]",
]);
</script>
<style scoped></style>
