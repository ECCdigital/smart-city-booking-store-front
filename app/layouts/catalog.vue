<script setup>
import NavigationBar from "~/components/navigation/NavigationBar.vue";

const catalogTabs = [
  {
    label: "Buchungsobjekte",
    icon: "i-lucide-shopping-basket",
    value: "/bookables",
  },
  {
    label: "Veranstaltungen",
    icon: "i-lucide-calendar",
    value: "/events",
  },
];
</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950">
    <NavigationBar :tabs="catalogTabs">
      <template #actions>
        <TenantSwitcher class="mr-2" />
      </template>
    </NavigationBar>

    <HeroSection />

    <NuxtPage />
  </div>
</template>
