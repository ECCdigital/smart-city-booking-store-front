<template>
  <nav class="flex flex-wrap gap-2" :aria-label="t('catalog.type')">
    <UButton
      v-for="type in types"
      :key="type.value"
      :to="tenantTo(type.value)"
      :icon="type.icon"
      :label="type.label"
      :variant="isActivePath(type.value) ? 'solid' : 'outline'"
      :color="isActivePath(type.value) ? 'secondary' : 'primary'"
      :style="
        isActivePath(type.value) ? { color: contrastToSecondary } : undefined
      "
      :aria-current="isActivePath(type.value) ? 'page' : undefined"
      class="rounded-full px-4"
    />
  </nav>
</template>

<script setup>
import { useContrastColor } from "~/composables/utils/useContrastColor.js";

/**
 * Bookables or events -- the choice the navigation bar used to carry, now next
 * to the search where the results are. Two buttons for as long as there are two
 * lists; a single merged list replaces them later.
 */
const { t } = useI18n();
const { tenantTo, isActivePath } = useTenantRoute();
const { contrastToSecondary } = useContrastColor();

const types = computed(() => [
  {
    value: "/bookables",
    icon: "i-lucide-shopping-basket",
    label: t("catalog.bookables"),
  },
  {
    value: "/events",
    icon: "i-lucide-calendar",
    label: t("catalog.events"),
  },
]);
</script>
