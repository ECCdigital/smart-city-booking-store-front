<template>
  <div :class="barClass">
    <div v-for="(tab, k) in tabs" :key="k">
      <NavigationLink :tab="tab" />
    </div>
    <div style="flex: 1"/>
    <UButton
      :label="isGreaterThanSm ? 'Anmelden' : ''"
      :icon="isGreaterThanSm ? '' : 'i-lucide-user'"
      variant="ghost"
      class="text-white"
      :class="isGreaterThanSm ? 'px-4' : ''"
      to="/login"
    />
    <UButton
      v-if="isGreaterThanSm"
      label="Registrieren"
      class="px-4 text-black bg-white"
      to="/register"
    />
    <UColorModeButton class="" size="xl" @click="toggleColorMode"/> <!-- toDo - delete after Testing!!!  -->
    <!-- toDo - https://ui.nuxt.com/docs/components/field-group (with dropdown) -->
  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";
import { useBreakpointCheck } from "../composables/utils/useBreakpointCheck.js";
import { useColorMode } from '@vueuse/core'


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

const colorMode = useColorMode()
function toggleColorMode() {
  if (colorMode.value === 'dark') {
    colorMode.value = 'light'
  } else {
    colorMode.value = 'dark'
  }
}
</script>
<style scoped></style>
