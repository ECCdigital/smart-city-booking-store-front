<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useTenant } from "~/composables/useTenant";

const t = useI18n().t;

const props = defineProps({
  /**
   * Where the switcher is rendered.
   *
   * `bar` is the navigation bar: it names the tenant the visitor is already in
   * and opens the list from the chevron next to the name. Without a selected
   * tenant it renders nothing -- choosing one is the footer's job.
   *
   * `footer` is the one place the selection always lives, with or without a
   * tenant.
   */
  variant: {
    type: String,
    default: "bar",
    validator: (value) => ["bar", "footer"].includes(value),
  },
});

const route = useRoute();
const { tenantID } = useTenant();

const tenantStore = useTenantStore();
const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenants.value.find((tenant) => tenant.id === tenantID.value);
});

const isBar = computed(() => props.variant === "bar");

const tenantOptions = computed(() => {
  const items = [];

  if (selectedTenant.value) {
    items.push({
      label: t("tenants.clearSelection"),
      id: null,
      onSelect: onClear,
    });

    items.push({
      type: "separator",
    });
  }

  items.push(
    ...tenants.value.map((tenant) => ({
      label: tenant.name,
      id: tenant.id,
      onSelect: () => onSelect(tenant),
      slot: "prefix",
    })),
  );

  return items;
});

// In the bar the switcher is the site's identity, so it only shows once there is
// a name to show; in the footer it is the control itself and stays.
const isVisible = computed(() => {
  if (tenantOptions.value.length === 0) return false;
  return isBar.value ? !!selectedTenant.value : true;
});

const label = computed(
  () => selectedTenant.value?.name ?? t("tenants.selectTenant"),
);

function onSelect(tenant) {
  const { path, query, hash } = route;
  const pathWithoutTenant = path.replace(/^\/t\/[^/]+/, "") || "/";

  if (tenant.id === selectedTenant.value?.id) {
    tenantStore.setCurrentTenantID(null);
    return navigateTo({
      path: pathWithoutTenant,
      query,
      hash,
    });
  } else {
    tenantStore.setCurrentTenantID(tenant.id);
    const targetPath =
      pathWithoutTenant === "/"
        ? `/t/${tenant.id}`
        : `/t/${tenant.id}${pathWithoutTenant}`;
    return navigateTo({
      path: targetPath,
      query,
      hash,
    });
  }
}

function onClear() {
  const { path, query, hash } = route;
  const pathWithoutTenant = path.replace(/^\/t\/[^/]+/, "") || "/";

  return navigateTo({
    path: pathWithoutTenant,
    query,
    hash,
  });
}

const { contrastToPrimary } = useContrastColor();

// In the bar the name gives way before the actions do: it shrinks and clips
// rather than pushing the language and colour mode buttons off a phone's line.
const buttonClass = computed(() =>
  isBar.value
    ? "h-12 min-w-0 px-2 sm:px-3 font-medium hover:!bg-current/15 active:!bg-current/20"
    : "px-0 text-gray-700 dark:text-gray-300",
);
</script>

<template>
  <UDropdownMenu
    v-if="isVisible"
    size="lg"
    :items="tenantOptions"
    :ui="{
      content: 'ring-0 shadow-lg glass',
      itemLeadingIcon: 'mt-1',
      item: ' before:bg-transparent data-highlighted:before:bg-transparent',
    }"
  >
    <UButton
      variant="ghost"
      color="neutral"
      :icon="isBar ? undefined : 'i-lucide-building-2'"
      trailing-icon="i-lucide-chevron-down"
      :label="label"
      :class="buttonClass"
      :ui="isBar ? { label: 'truncate', trailingIcon: 'shrink-0' } : undefined"
      :style="isBar ? { color: contrastToPrimary } : undefined"
    />
  </UDropdownMenu>
</template>

<style scoped></style>
