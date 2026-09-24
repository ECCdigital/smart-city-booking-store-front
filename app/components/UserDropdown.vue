<script setup>
import { useAuthStore } from "~~/stores/auth.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useMemberships } from "~/composables/api/useMemberships.js";

const { tenantTo } = useTenantRoute();

const { t } = useI18n();

const config = useRuntimeConfig();
const authStore = useAuthStore();
const notification = useNotification();

const { contrastToPrimary } = useContrastColor();
const nameColor = computed(() => {
  if (contrastToPrimary.value === "#ffffff") {
    return "text-white hidden md:inline";
  } else {
    return "text-black hidden md:inline";
  }
});

const user = computed(() => authStore.getUser);

const userName = computed(() => {
  const fullname = user.value?.firstName + " " + user.value?.lastName;
  const suffix = fullname.length > 20 ? "..." : "";
  return fullname.slice(0, 20) + suffix;
});

const hasMemberships = ref(false);

onMounted(async () => {
  const { fetchMyMemberships } = useMemberships();

  try {
    const memberships = await fetchMyMemberships();
    hasMemberships.value = Array.isArray(memberships) && memberships.length > 0;
  } catch {
    hasMemberships.value = false;
  }
});

const items = computed(() => {
  const adminSection = hasMemberships.value
    ? [
        [
          {
            label: t("navigation.admin"),
            icon: "i-lucide-user-star",
            to: config.public.adminBaseUrl,
            target: "_blank",
          },
        ],
      ]
    : [];

  return [
    ...adminSection,
    [
      {
        label: t("navigation.activities"),
        class: "font-bold cursor-default hover:bg-transparent",
      },
      {
        label: t("navigation.bookings"),
        icon: "i-lucide-book-marked",
        onSelect: () => goTo("/account/bookings"),
      },
      {
        label: t("navigation.digitalKeys"),
        icon: "i-lucide-key-round",
        onSelect: () => goTo("/mobile-key"),
      },
      {
        label: t("navigation.invoices"),
        icon: "i-lucide-wallet-cards",
        onSelect: () => goTo("/account/invoices"),
      },
      /*{
        label: "Favoriten",
        icon: "i-lucide-book-heart",
        onSelect: () => goTo("/account/favorites"),
        disabled: true,
      },*/
    ],
    [
      {
        label: t("navigation.account"),
        class: "font-bold cursor-default hover:bg-transparent",
      },
      {
        label: t("navigation.settings"),
        icon: "i-lucide-settings",
        onSelect: () => goTo("/account/settings"),
      },
      {
        label: t("common.logout"),
        icon: "i-lucide-log-out",
        onSelect: () => logout(),
      },
    ],
  ];
});
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
    // Not through `tenantTo`: the tenant-routes module skips `/login`, so the
    // sign-in page lives at the same address inside and outside a catalogue.
    // No `redirect` either — whoever signs out means to leave the page.
    await navigateTo("/login");
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
      item: 'before:bg-transparent data-highlighted:before:bg-transparent',
    }"
    class="pr-0 md:pr-1"
  >
    <UButton
      variant="ghost"
      class="flex items-center gap-2 px-1 sm:px-2.5 outline-none"
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
