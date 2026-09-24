<template>
  <!-- On a phone the actions sit tight against each other so the language and
       colour mode buttons still fit on the same line. -->
  <div class="flex items-center gap-0 sm:gap-3">
    <template v-if="!isAuthenticated">
      <UButton
        :label="isGreaterThanSm ? t('common.login') : ' '"
        :icon="isGreaterThanSm ? '' : 'i-lucide-log-in'"
        variant="ghost"
        class="block px-1 sm:px-2"
        :style="{ color: contrastToPrimary }"
        :to="loginTo"
      />
      <UButton
        v-if="isGreaterThanSm"
        :label="t('common.register')"
        class="hidden sm:block px-4 text-black dark:text-white bg-white dark:bg-black"
        :to="registerTo"
      />
    </template>
    <div v-else class="flex sm:gap-3">
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

const { t } = useI18n();

const { contrastToPrimary } = useContrastColor();
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
