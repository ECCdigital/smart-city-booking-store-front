<template>
  <!-- The coloured surface stays full-bleed; only its content is held to the
       container edges. Keep the background (and any future sticky positioning)
       on this outer element -- iOS 26 only tints the status bar area from a bar
       that spans the full width. -->
  <div :class="barClass">
    <div class="container flex justify-between">
      <div class="flex">
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
        <div class="flex items-center gap-2 sm:gap-3">
          <slot name="actions" />
          <ColorModeToggle />
          <AuthActions />
        </div>
        <template #fallback>
          <div class="flex items-center gap-2 sm:gap-3 px-4 opacity-50">
            <USkeleton class="h-8 w-20" />
            <USkeleton class="h-8 w-8" />
            <USkeleton class="h-8 w-24" />
          </div>
        </template>
      </ClientOnly>
    </div>
  </div>
</template>

<script setup>
import NavigationLink from "./NavigationLink.vue";
import AuthActions from "~/components/navigation/AuthActions.vue";
import ColorModeToggle from "~/components/navigation/ColorModeToggle.vue";

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
});

const barClass = computed(() => ["bg-[var(--color-secondary)]"]);
</script>
