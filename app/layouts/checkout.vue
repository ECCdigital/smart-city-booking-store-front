<script setup lang="ts">
const checkoutNavTab = useState("checkoutNavTab", () => "");

const mounted = ref(false);
onMounted(() => {
  mounted.value = true;
});

const checkoutTabs = computed(() => {
  if (!mounted.value || !checkoutNavTab.value) return [];
  return [
    {
      label: checkoutNavTab.value.label,
      icon: "i-lucide-shopping-cart",
      value: checkoutNavTab.value.url,
    },
  ];
});
</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950">
    <NavigationBar :tabs="checkoutTabs" />
    <div>
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
