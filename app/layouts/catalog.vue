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
  <div class="bg-surface-base">
    <NavigationBar :tabs="catalogTabs">
      <template #actions>
        <TenantSwitcher />
      </template>
    </NavigationBar>

    <HeroSection />

    <NuxtPage />
  </div>
</template>
