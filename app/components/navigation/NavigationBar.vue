<template>
  <div :class="barClass">
    <div class="container flex justify-between">
      <div class="flex min-w-0 items-center">
        <UTooltip :text="$t('navigation.backToHome')">
          <NavigationLink
            :tab="{ value: '/', icon: 'i-lucide-home', label: '' }"
          />
        </UTooltip>

        <ClientOnly>
          <TenantSwitcher class="text-lg font-bold" />
        </ClientOnly>

        <div v-for="(tab, k) in tabs" :key="k">
          <NavigationLink :tab="tab" />
        </div>
      </div>

      <ClientOnly>
        <div class="flex shrink-0 items-center gap-1 sm:gap-3">
          <slot name="actions" />
          <AuthActions />

          <div
            class="h-6 w-px opacity-30"
            :style="{ backgroundColor: contrastToSecondary }"
          />

          <div class="flex items-center">
            <LanguageToggle />
            <ColorModeToggle />
          </div>
        </div>
        <template #fallback>
          <div class="flex items-center gap-2 sm:gap-3 px-4 opacity-50">
            <USkeleton class="h-8 w-20" />
            <USkeleton class="h-8 w-24" />
            <USkeleton class="h-8 w-8" />
            <USkeleton class="h-8 w-8" />
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
import LanguageToggle from "~/components/navigation/LanguageToggle.vue";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
});

const { contrastToSecondary } = useContrastColor();

// Below `sm` (the width the app treats as "phone") the bar stays pinned to the
// top edge while the page scrolls under it; from `sm` up it flows as before.
//
// `z-10` matches the app's existing sticky elements (checkout stepper, price bar)
// and keeps the bar above page content, whose stacking stays at `z-0`/auto. It
// cannot swallow Nuxt UI overlays: `UApp` renders as `<div class="isolate">`, and
// modals, tooltips and toasts are teleported next to that element rather than
// into it, so any z-index in the app is confined below them.
//
// iOS 26 also samples this bar to paint the area behind the status bar, which is
// why the app no longer looks grey up there. WebKit only does that for a
// sticky/fixed element at the top edge that is at least 90% wide, taller than
// 10px, opaque and free of `backdrop-filter` — so adding `.glass`, a blur or an
// alpha-bearing background colour here would silently turn that colouring off.
const barClass = computed(() => [
  "bg-[var(--color-primary)]",
  "sticky top-0 z-10 sm:static",
]);
</script>
