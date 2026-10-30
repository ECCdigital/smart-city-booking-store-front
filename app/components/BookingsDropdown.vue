<template>
  <UButton
    variant="ghost"
    class="flex items-center gap-2 px-1 sm:px-2.5 outline-none"
    @click="() => goTo('/account/bookings')"
  >
    <UUser
      :name="t('navigation.accountBookings')"
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
const { tenantTo } = useTenantRoute();

const t = useI18n().t;

// The label sits on the header bar, so it takes the bar's text colour.
const nameColor = "text-[color:var(--ui-header-contrast)] hidden md:inline";

function goTo(targetString) {
  const router = useRouter();
  const tenantTargetString = tenantTo(targetString);
  router.push(tenantTargetString);
}
</script>

<style scoped></style>
