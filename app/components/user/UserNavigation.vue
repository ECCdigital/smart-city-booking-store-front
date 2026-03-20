<template>
  <div
    class="md:basis-1/6 border border-gray-200 rounded mb-5 md:mb-0 m-2 md:m-0 md:p-2 md:space-y-1 flex md:block md:h-64"
  >
    <div
      v-for="(item, i) in userNavigation"
      :key="i"
      class="basis-1/2 md:basis-full flex w-full"
    >
      <UTooltip text="Coming soon..." :disabled="!item.disabled">
        <NuxtLink
          class="grid sm:flex rounded p-2 w-full justify-center md:justify-start items-center text-center md:text-left"
          :class="getLinkClasses(item)"
          :to="item.disabled ? '' : tenantTo(item.value)"
        >
          <div class="flex justify-center">
            <UIcon :name="item.icon" class="sm:mr-3 mt-1" />
          </div>
          <div class="text-sm md:text-md mt-1 md:mt-0">{{ item.label }}</div>
        </NuxtLink>
      </UTooltip>
    </div>
  </div>
</template>
<script setup>
const { tenantTo, isActivePath } = useTenantRoute();

const userNavigation = computed(() => [
  {
    value: "/user/bookings",
    label: "Buchungen",
    icon: "i-lucide-book-marked",
    disabled: false,
  },
  {
    value: "/user/keys",
    label: "Schlüssel",
    icon: "i-lucide-key-round",
    disabled: false,
  },
  {
    value: "/user/invoices",
    label: "Rechnungen",
    icon: "i-lucide-wallet-cards",
    disabled: true,
  },
  {
    value: "/user/favorites",
    label: "Favoriten",
    icon: "i-lucide-book-heart",
    disabled: true,
  },
]);

const inactiveLinkStyle = computed(
  () => "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 hover:dark:bg-gray-800"
);
const disabledLinkStyle = computed(
  () => "cursor-not-allowed opacity-75 bg-gray-100 dark:bg-gray-900"
);
const activeLinkStyle = computed(
  () => "bg-primary/20 hover:bg-primary/40 font-semibold"
);

function getLinkClasses(item) {
  if (item.disabled) {
    return disabledLinkStyle.value;
  } else if (isActive(item.value)) {
    return activeLinkStyle.value;
  } else {
    return inactiveLinkStyle.value;
  }
}
function isActive(path) {
  return isActivePath(path);
}
</script>

<style scoped></style>
