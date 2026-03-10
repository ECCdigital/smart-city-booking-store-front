<template>
  <div
    class="md:basis-1/6 border border-gray-200 rounded m-2 md:m-0 md:p-2 md:space-y-1 flex md:block md:h-64 "
  >
    <div
      v-for="(item, i) in settingsNavigation"
      :key="i"
      class="basis-1/2 md:basis-full flex w-full"
    >
      <NuxtLink
        class="grid sm:flex rounded p-2 w-full justify-center md:justify-start items-center text-center md:text-left"
        :class="getLinkClasses(item)"
        :to="item.disabled ? '' : tenantTo(item.value)"
      >
        <div class="flex justify-center"><UIcon :name="item.icon" class="sm:mr-3 mt-1" /></div>
        <div>{{ item.label }}</div>
      </NuxtLink>
    </div>
  </div>
</template>
<script setup>
const { tenantTo, isActivePath } = useTenantRoute();

const settingsNavigation = computed(() => [
  {
    value: "/user/settings",
    label: "Persönliche Daten",
    icon: "i-lucide-user-round-pen",
    disabled: false,
  },
  {
    value: "/user/settings/appearance",
    label: "Darstellung",
    icon: "i-lucide-paintbrush",
    disabled: false,
  },
]);

//const route = useRoute();

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
