<template>
  <div :class="barClass">
    <div v-for="(tab, k) in tabs" :key="k">
      <NavigationLink :tab="tab" />
    </div>
    <div style="flex: 1" />
    <UButton
      :label="isGreaterThanSm ? 'Anmelden' : ' '"
      :icon="isGreaterThanSm ? '' : 'i-lucide-user'"
      :size="isGreaterThanSm ? 'xl' : ' '"
      variant="ghost"
      :class="isGreaterThanSm ? 'px-4' : 'px-2'"
      :style="{ color: contrastToSecondary }"
      to="/login"
    />
    <UButton
      v-if="isGreaterThanSm"
      label="Registrieren"
      class="px-4 text-black dark:text-white bg-white dark:bg-black"
      to="/register"
    />
    <UColorModeButton
      size="xl"
      :style="{ color: contrastToSecondary }"
      @click="toggleColorMode"
    />
    <!-- toDo - delete after Testing!!!  -->
    <!-- toDo - https://ui.nuxt.com/docs/components/field-group (with dropdown) -->
  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";
import { useBreakpointCheck } from "../composables/utils/useBreakpointCheck.js";
import { useColorMode } from "@vueuse/core";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const tabs = computed(() => [
  {
    label: "Orte",
    icon: "i-heroicons-map-pin",
    value: `/locations`,
  },
  {
    label: "Veranstaltungen",
    icon: "i-heroicons-calendar",
    value: `/events`,
  },
  {
    label: "Geräte & Ressourcen",
    icon: "i-heroicons-wrench-screwdriver",
    value: `/bookables`,
  },
]);

const isGreaterThanSm = computed(() => useBreakpointCheck().isGreaterThanSm());
const contrastToSecondary = computed(() => {
      const temp = useContrastColor().contrastToSecondary();
          console.log(temp)
      return temp
    }
);

const barClass = computed(() => [
  "flex items-center bg-[var(--color-secondary)]",
]);

const colorMode = useColorMode();
function toggleColorMode() {
  if (colorMode.value === "dark") {
    colorMode.value = "light";
  } else {
    colorMode.value = "dark";
  }
}
</script>
<style scoped></style>
