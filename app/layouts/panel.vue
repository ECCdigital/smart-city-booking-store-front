<script setup lang="ts">
import {
  navigationPresets,
  type NavigationPreset,
} from "~/composables/useNavigationItems";
import SideNavigation from "~/components/navigation/SideNavigation.vue";

const route = useRoute();

const navItems = computed(
  () =>
    navigationPresets[route.meta.navigation as NavigationPreset] ??
    navigationPresets.user
);
</script>

<template>
  <div class="bg-surface-base">
    <NavigationBar />

    <div
      class="sm:container-md md:container md:flex h-min-[60vh] w-full md:mx-auto pt-2 md:pt-7"
    >
      <SideNavigation :items="navItems" />
      <div class="px-2 md:px-5 md:basis-5/6">
        <slot />
      </div>
    </div>
  </div>
</template>
