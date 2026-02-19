<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { tenantTo } = useTenantRoute();

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
  const fullname = user.value?.firstName + " " + user.value?.lastName;
  const suffix = fullname.length > 20 ? "..." : "";
  return fullname.slice(0, 20)+suffix;
});

const items = [
  [
    {
      label: t("navigation.admin"),
      icon: "i-lucide-user-star",
      to: config.public.adminBaseUrl,
      target: "_blank",
    },
  ],
  [
    {
      label: "Benutzerkonto",
      class: "font-bold cursor-default hover:bg-transparent",
    },
    {
      label: "Buchungen",
      icon: "i-lucide-book-marked",
      onSelect: () => goTo("/user/bookings"),
    },
    {
      label: "Rechnungen",
      icon: "i-lucide-wallet-cards",
      onSelect: () => goTo("/user/invoices"),
      disabled: true,
    },
    {
      label: "Favoriten",
      icon: "i-lucide-book-heart",
      onSelect: () => goTo("/user/favorites"),
      disabled: true,
    },
  ],
  [
    {
      label: t("navigation.settings"),
      icon: "i-lucide-settings",
      onSelect: () => goTo("/user/settings")
    },
    {
      label: t("common.logout"),
      icon: "i-lucide-log-out",
      onSelect: () => logout(),
    },
  ],
];
function goTo(targetString) {
  const router = useRouter();
  const tenantTargetString = tenantTo(targetString);
  router.push(tenantTargetString);
}

async function logout() {
  try {
    await authStore.logout();
    notification.success(
      t("notifications.logoutSuccess.message"),
      t("notifications.logoutSuccess.title"),
    );
    const router = useRouter();
    await router.push("/login");
  } catch {
    notification.error(
      t("login.logoutErrorMessage.message"),
      t("login.logoutErrorMessage.title"),
    );
  }
}
</script>

<template>
  <UDropdownMenu
    size="lg"
    :items="items"
    :ui="{
      content: 'ring-0 shadow-lg glass',
      itemLeadingIcon: 'mt-1',
      item: 'before:bg-transparent data-highlighted:before:bg-transparent'
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
