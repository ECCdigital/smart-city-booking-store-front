<template>
  <div class="flex items-center">
    <template v-if="!isAuthenticated">
      <UButton
        :label="isGreaterThanSm ? 'Anmelden' : ' '"
        :icon="isGreaterThanSm ? '' : 'i-lucide-log-in'"
        variant="ghost"
        class="block px-2"
        :style="{ color: contrastToSecondary }"
        :to="loginTo"
      />
      <UButton
        v-if="isGreaterThanSm"
        label="Registrieren"
        class="hidden sm:block px-4 text-black dark:text-white bg-white dark:bg-black"
        :to="registerTo"
      />
    </template>
    <div v-else class="flex">
      <BookingsDropdown />
      <UserDropdown />
    </div>
  </div>
</template>

<script setup>
import UserDropdown from "~/components/UserDropdown.vue";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck";
import { useAuthStore } from "~~/stores/auth.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import BookingsDropdown from "~/components/BookingsDropdown.vue";

const { contrastToSecondary } = useContrastColor();
const { isGreaterThanSm } = useBreakpointCheck();
const authStore = useAuthStore();
const route = useRoute();
const isAuthenticated = computed(() => authStore.isLoggedIn);

const loginTo = computed(
  () => `/login?redirect=${encodeURIComponent(route.fullPath)}`,
);
const registerTo = computed(
  () => `/register?redirect=${encodeURIComponent(route.fullPath)}`,
);
</script>
