<template>
  <div
    class="md:basis-1/6 border border-gray-200 rounded m-2 md:m-0 md:p-2 md:space-y-1 flex md:block"
  >
    <div v-for="(item, i) in userNavigation" :key="i">
      <NuxtLink
        class="basis-1/3 md:basis-full flex rounded p-2 cursor-pointer w-full"
        :class="isActive(item.value) ? activeLinkStyle : inactiveLinkStyle"
        :to="item.value"
      >
        <UIcon :name="item.icon" class="mr-3 mt-1" />
        {{ item.label }}
      </NuxtLink>
    </div>
  </div>
</template>
<script setup>
const userNavigation = computed(() => [
  {
    value: "/user/bookings",
    label: "Buchungen",
    icon: "i-lucide-book-marked",
  },
  {
    value: "/user/invoices",
    label: "Rechnungen",
    icon: "i-lucide-wallet-cards",
  },
  {
    value: "/user/favorites",
    label: "Favoriten",
    icon: "i-lucide-book-heart",
  },
]);

const route = useRoute();

const inactiveLinkStyle = computed(
  () => "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 hover:dark:bg-gray-800",
);
const activeLinkStyle = computed(
  () => "bg-primary/20 hover:bg-primary/40 font-semibold",
);

function isActive(path) {
  return route.path === path;
}
</script>

<style scoped></style>
