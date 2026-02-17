<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

//const { isGreaterThanMd } = useBreakpointCheck();

const t = useI18n().t;

const config = useRuntimeConfig();
const authStore = useAuthStore();
const notification = useNotification();

const { contrastToSecondary } = useContrastColor();
const nameColor = computed(() => {
  if (contrastToSecondary.value === "#ffffff") {
    return "text-white hidden md:inline";
  } else {
    return "text-black hidden md:inline";
  }
});

const user = computed(() => authStore.getUser);

const userName = computed(() => {
  return user.value?.firstName + " " + user.value?.lastName;
});

const items = [
  [
    /**
    {
      label: t("navigation.users"),
      icon: "i-lucide-user",
      to: "/users",
    },
        **/
    {
      label: t("navigation.admin"),
      icon: "i-lucide-user-star",
      to: config.public.adminBaseUrl,
      target: "_blank",
    },
  ],
  [
    {
      label: t("common.logout"),
      icon: "i-lucide-log-out",
      onSelect: () => logout(),
    },
  ],
];

async function logout() {
  try {
    await authStore.logout();
    notification.success(
      t("notifications.logoutSuccess.message"),
      t("notifications.logoutSuccess.title")
    );
  } catch {
    notification.error(
      t("login.logoutErrorMessage.message"),
      t("login.logoutErrorMessage.title")
    );
  }
}
</script>

<template>
  <UDropdownMenu
    :items="items"
    :ui="{
      content: 'ring-0 shadow-lg glass',
    }"
  >
    <UButton
      variant="ghost"
      class="flex items-center gap-2 outline-none cursor-pointer"
    >
      <UUser
        :name="userName"
        :avatar="{
          icon: 'i-lucide-user',
        }"
        :ui="{
          base: 'transition-none',
          avatar: {
            size: 'h-8 w-8',
          },
          name: nameColor,
        }"
      />
    </UButton>
  </UDropdownMenu>
</template>

<style scoped></style>
