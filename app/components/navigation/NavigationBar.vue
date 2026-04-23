<template>
  <div :class="barClass" class="flex justify-between">
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
      <div class="flex items-center">
        <slot name="actions" />
        <AuthActions />
      </div>
      <template #fallback>
        <div class="flex items-center gap-2 px-4 opacity-50">
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

defineProps({
  tabs: {
    type: Array,
    default: () => [],
  },
});

const barClass = computed(() => ["bg-[var(--color-secondary)]"]);
</script>
