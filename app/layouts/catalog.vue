<script setup>
import NavigationBar from "~/components/navigation/NavigationBar.vue";
import { useCatalogAuthReload } from "~/composables/useCatalogAuthReload";

useCatalogAuthReload();

const route = useRoute();
// The Hero's Live Preview is for looking, not for leaving: a link out of the
// frame would take the editor's Draft with it. The Hero itself stays live —
// the preview reports its Block clicks.
const isHeroPreview = computed(() => route.meta.hero === "preview");

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
    <NavigationBar :tabs="catalogTabs" :inert="isHeroPreview || undefined">
      <template #actions>
        <TenantSwitcher />
      </template>
    </NavigationBar>

    <HeroSection />

    <NuxtPage />

    <AppFooter class="mt-auto" :inert="isHeroPreview || undefined" />
  </div>
</template>
