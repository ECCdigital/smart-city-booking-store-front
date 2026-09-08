<template>
  <UButton
    variant="ghost"
    class="flex items-center gap-2 outline-none cursor-pointer"
    @click="() => goTo('/account/bookings')"
  >
    <UUser
      name="Meine Buchungen"
      :avatar="{
        icon: 'i-lucide-handbag',
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
</template>
<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { tenantTo } = useTenantRoute();

const { contrastToSecondary } = useContrastColor();
const nameColor = computed(() => {
  if (contrastToSecondary.value === "#ffffff") {
    return "text-white hidden md:inline";
  } else {
    return "text-black hidden md:inline";
  }
});

const items = computed(() => {
  return [
    [
      {
        label: "Buchungen",
        icon: "i-lucide-book-marked",
        onSelect: () => goTo("/account/bookings"),
      },
      {
        label: "Digitale Schlüssel",
        icon: "i-lucide-key-round",
        onSelect: () => goTo("/mobile-key"),
      },
      {
        label: "Rechnungen",
        icon: "i-lucide-wallet-cards",
        onSelect: () => goTo("/account/invoices"),
        disabled: true,
      },
      {
        label: "Favoriten",
        icon: "i-lucide-book-heart",
        onSelect: () => goTo("/account/favorites"),
        disabled: true,
      },
    ],
  ];
});
function goTo(targetString) {
  const router = useRouter();
  const tenantTargetString = tenantTo(targetString);
  router.push(tenantTargetString);
}
</script>

<style scoped></style>
