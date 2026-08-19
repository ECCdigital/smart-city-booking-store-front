<script setup>
import NavigationBar from "~/components/navigation/NavigationBar.vue";
import { useCatalogAuthReload } from "~/composables/useCatalogAuthReload";

useCatalogAuthReload();

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
  <!-- Column layout so the footer sticks to the bottom of short pages -->
  <div class="flex min-h-screen flex-col bg-neutral-50 dark:bg-gray-950">
    <NavigationBar :tabs="catalogTabs">
      <template #actions>
        <TenantSwitcher />
      </template>
    </NavigationBar>

    <HeroSection />

    <NuxtPage />

    <AppFooter class="mt-auto" />
  </div>
</template>
