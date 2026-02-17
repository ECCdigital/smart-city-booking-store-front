<template>
  <div :class="barClass" class="flex justify-between">
    <div class="flex">
      <div v-for="(tab, k) in tabs" :key="k">
        <NavigationLink :tab="tab" />
      </div>
    </div>
    <ClientOnly>
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
      </div>
    </ClientOnly>
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
    label: "Buchungsobjekte",
    icon: "i-lucide-shopping-basket",
    value: `/bookables`,
  },
  {
    label: "Veranstaltungen",
    icon: "i-lucide-calendar",
    value: `/events`,
  },
]);


const { contrastToSecondary } = useContrastColor();


const { isGreaterThanSm } = useBreakpointCheck();

const barClass = computed(() => ["bg-[var(--color-secondary)]"]);

const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isLoggedIn);
</script>
<style scoped></style>
