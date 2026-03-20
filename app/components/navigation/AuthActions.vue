<template>
  <div class="flex items-center">
    <template v-if="!isAuthenticated">
      <UButton
        :label="isGreaterThanSm ? 'Anmelden' : ' '"
        :icon="isGreaterThanSm ? '' : 'i-lucide-log-in'"
        variant="ghost"
        class="block px-2"
        :style="{ color: contrastToSecondary }"
        to="/login"
      />
      <UButton
        v-if="isGreaterThanSm"
        label="Registrieren"
        class="hidden sm:block px-4 text-black dark:text-white bg-white dark:bg-black"
        to="/register"
      />
    </template>
    <UserDropdown v-else />
  </div>
</template>

<script setup>
import UserDropdown from "~/components/UserDropdown.vue";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck";
import { useAuthStore } from "~~/stores/auth.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToSecondary } = useContrastColor();
const { isGreaterThanSm } = useBreakpointCheck();
const authStore = useAuthStore();
const isAuthenticated = computed(() => authStore.isLoggedIn);
</script>
