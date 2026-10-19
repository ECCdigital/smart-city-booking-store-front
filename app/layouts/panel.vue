<script setup lang="ts">
import {
  navigationPresets,
  type NavigationPreset,
} from "~/composables/useNavigationItems";
import SideNavigation from "~/components/navigation/SideNavigation.vue";
import { useInstanceStore } from "~~/stores/instance.js";

const route = useRoute();
const instanceStore = useInstanceStore();

const navItems = computed(() => {
  const items =
    navigationPresets[route.meta.navigation as NavigationPreset] ??
    navigationPresets.user;
  if (instanceStore.usesDigitalKeys) return items;
  return items.filter((item) => item.value !== "/mobile-key");
});
</script>

<template>
  <!-- Column layout so the footer sticks to the bottom of short pages -->
  <div class="flex min-h-screen flex-col bg-neutral-50 dark:bg-gray-950">
    <NavigationBar />

    <div
      class="container md:flex h-min-[60vh] w-full pt-2 md:pt-7"
    >
      <SideNavigation :items="navItems" class="md:basis-1/4" />
      <div class="px-2 md:px-5 md:basis-5/6">
        <slot />
      </div>
    </div>

    <AppFooter class="mt-auto" />
  </div>
</template>
