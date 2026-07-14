<template>
  <div
    :class="barClass"
    class="flex items-center justify-between h-12 px-3 sm:px-4"
  >
    <div class="flex items-center h-full min-w-0">
      <UTooltip text="Zurück zur Startseite">
        <NavigationLink
          :tab="{ value: '/', icon: 'i-lucide-home', label: '' }"
        />
      </UTooltip>
      <div v-for="(tab, k) in tabs" :key="k">
        <NavigationLink :tab="tab" />
      </div>
    </div>

    <ClientOnly>
      <div class="flex items-center h-full gap-2 sm:gap-3 shrink-0">
        <ColorModeToggle :icon-color="contrastToSecondary" />
        <slot name="actions" />
        <AuthActions />
      </div>
      <template #fallback>
        <div class="flex items-center h-full gap-2 sm:gap-3 opacity-50">
          <USkeleton class="h-8 w-20" />
          <USkeleton class="h-8 w-24" />
        </div>
      </template>
    </ClientOnly>
  </div>
</template>

<script setup>
import NavigationLink from "./NavigationLink.vue";
import AuthActions from "~/components/navigation/AuthActions.vue";
import ColorModeToggle from "~/components/ColorModeToggle.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

const { contrastToSecondary } = useContrastColor();

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
});

const barClass = computed(() => ["bg-[var(--color-secondary)]"]);
</script>
