<script setup>
import NavigationBar from "~/components/navigation/NavigationBar.vue";
import { useCatalogAuthReload } from "~/composables/useCatalogAuthReload";

useCatalogAuthReload();

const route = useRoute();
// The Hero's Live Preview is for looking, not for leaving: a link out of the
// frame would take the editor's Draft with it. The Hero itself stays live —
// the preview reports its Block clicks.
const isHeroPreview = computed(() => route.meta.hero === "preview");
</script>

<template>
  <!-- Column layout so the footer sticks to the bottom of short pages -->
  <div class="flex min-h-screen flex-col bg-neutral-50 dark:bg-gray-950">
    <!-- Bookables and events are chosen on the result pages, next to the search,
         not in the bar. -->
    <NavigationBar :inert="isHeroPreview || undefined" />

    <HeroSection />

    <NuxtPage />

    <AppFooter class="mt-auto" :inert="isHeroPreview || undefined" />
  </div>
</template>
