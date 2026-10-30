<template>
  <div :class="barClass">
    <div class="container flex justify-between">
      <!-- The auth pages show only the way to the start page, named, since
           the visitor has not got into the portal yet. -->
      <div v-if="variant === 'auth'" class="flex min-w-0 items-center">
        <NavigationLink
          :tab="{
            value: '/',
            icon: 'i-lucide-home',
            label: $t('navigation.home'),
          }"
          label-on-phone
        />
      </div>
      <div v-else class="flex min-w-0 items-center">
        <UTooltip :text="$t('navigation.backToHome')">
          <NavigationLink
            :tab="{
              value: '/',
              icon: 'i-lucide-home',
              label: '',
              ariaLabel: $t('navigation.backToHome'),
            }"
          />
        </UTooltip>
        <UTooltip :text="$t('navigation.toOffers')">
          <NavigationLink
            :tab="{
              value: '/search',
              icon: 'i-lucide-shopping-bag',
              label: '',
              ariaLabel: $t('navigation.toOffers'),
            }"
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
          <template v-if="variant !== 'auth'">
            <slot name="actions" />
            <AuthActions />

            <div
              class="h-6 w-px bg-(--ui-header-contrast) opacity-30"
            />
          </template>

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

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
  // "auth": the slim bar of the sign-in pages, with the start page, language
  // and colour mode only.
  variant: {
    type: String,
    default: "default",
  },
});

// Sticky on phones, static on larger screens. Keep opaque and free of
// `backdrop-filter`: iOS 26 samples this bar for the status-bar background.
const barClass = computed(() => [
  "bg-(--ui-header)",
  "sticky top-0 z-10 sm:static",
]);
</script>
