<template>
  <div :class="barClass" class="flex justify-between">
    <div class="flex">
      <div v-for="(tab, k) in tabs" :key="k">
        <NavigationLink :tab="tab" />
      </div>
    </div>
    <div class="flex items-center">
      <TenantSwitcher class="mr-2" />
      <UButton
          v-if="!isAuthenticated"
          :label="isGreaterThanSm ? 'Anmelden' : ' '"
          :icon="isGreaterThanSm ? '' : 'i-lucide-log-in'"
          variant="ghost"
          class="block px-2"
          :style="{ color: contrastToSecondary }"
          to="/login"
      />
      <UButton
          v-if="!isAuthenticated && isGreaterThanSm"
          label="Registrieren"
          class="hidden sm:block px-4 text-black dark:text-white bg-white dark:bg-black"
          to="/register"
      />

      <UserDropdown v-if="isAuthenticated" />
      <UButton
          class="pl-2 pt-1"
          size="xl"
          :icon="!isDark ? 'i-lucide-sun' : 'i-lucide-moon'"
          variant="ghost"
          :style="{ color: contrastToSecondary }"
          @click="isDark = !isDark"
      />
    </div>

  </div>
</template>
<script setup>
import NavigationLink from "./NavigationLink.vue";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck";
import { useAuthStore } from "~~/stores/auth.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import TenantSwitcher from "~/components/TenantSwitcher.vue";
import UserDropdown from "~/components/UserDropdown.vue";

const tabs = computed(() => [
  {
    label: "Orte",
    icon: "i-lucide-map-pin",
    value: `/locations`,
  },
  {
    label: "Veranstaltungen",
    icon: "i-lucide-calendar",
    value: `/events`,
  },
  {
    label: "Geräte & Ressourcen",
    icon: "i-lucide-monitor",
    value: `/bookables`,
  },
]);

const contrastToSecondary = computed(() => {
  return useContrastColor().contrastToSecondary();
});

const isGreaterThanSm = computed(() => useBreakpointCheck().isGreaterThanSm());

const barClass = computed(() => [
  "bg-[var(--color-secondary)]",
]);

const colorMode = useColorMode();
const isDark = computed({
  get() {
    return colorMode.value === "dark";
  },
  set(_isDark) {
    colorMode.preference = _isDark ? "dark" : "light";
  },
});

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isLoggedIn);
</script>
<style scoped></style>
