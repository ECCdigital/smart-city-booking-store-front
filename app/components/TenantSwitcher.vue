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

// Laid out like the user menu: a bold heading over the list, a leading icon on
// every entry, and the way out -- clearing the selection -- in a group of its
// own at the bottom, where the user menu keeps "sign out". The tenant in use
// is `active` and carries a check mark -- a mark, not a colour, because the
// theme's primary is the same dark tone in both colour modes and would read as
// disabled on the dark panel.
const tenantOptions = computed(() => {
  const sections = [
    [
      {
        type: "label",
        label: t("tenants.heading"),
        class: "font-bold",
      },
      ...tenants.value.map((tenant) => ({
        label: tenant.name,
        icon: "i-lucide-building-2",
        onSelect: () => onSelect(tenant),
        ...(tenant.id === selectedTenant.value?.id ? { active: true } : {}),
      })),
    ],
  ];

  if (selectedTenant.value) {
    sections.push([
      {
        label: t("tenants.clearSelection"),
        icon: "i-lucide-x",
        onSelect: onClear,
      },
    ]);
  }

  return sections;
});

// In the bar the switcher is the site's identity, so it only shows once there is
// a name to show; in the footer it is the control itself and stays.
const isVisible = computed(() => {
  if (tenants.value.length === 0) return false;
  return isBar.value ? !!selectedTenant.value : true;
});

const label = computed(
  () => selectedTenant.value?.name ?? t("tenants.selectTenant"),
);

function pathWithoutTenant() {
  return route.path.replace(/^\/t\/[^/]+/, "") || "/";
}

// Like the user menu, an entry does what it says: choosing the tenant already in
// use only closes the menu. Leaving the tenant is the clear entry's job.
function onSelect(tenant) {
  if (tenant.id === selectedTenant.value?.id) return;

  const { query, hash } = route;
  const rest = pathWithoutTenant();

  tenantStore.setCurrentTenantID(tenant.id);
  return navigateTo({
    path: rest === "/" ? `/t/${tenant.id}` : `/t/${tenant.id}${rest}`,
    query,
    hash,
  });
}

function onClear() {
  const { query, hash } = route;

  return navigateTo({
    path: pathWithoutTenant(),
    query,
    hash,
  });
}

const { contrastToPrimary } = useContrastColor();

// In the bar the trigger is the user menu's ghost button -- same padding, same
// (primary, hence invisible on the primary bar) hover -- with the name in place
// of the avatar. The name gives way before the actions do: it shrinks and clips
// rather than pushing the language and colour mode buttons off a phone's line.
// In the footer it keeps room on both sides so it does not hug its label.
const buttonClass = computed(() =>
  isBar.value
    ? "flex min-w-0 items-center gap-2 px-1 sm:px-2.5 outline-none"
    : "px-4 text-gray-700 dark:text-gray-300",
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
      item: 'before:bg-transparent data-highlighted:before:bg-transparent',
    }"
  >
    <UButton
      variant="ghost"
      :color="isBar ? 'primary' : 'neutral'"
      :icon="isBar ? undefined : 'i-lucide-building-2'"
      trailing-icon="i-lucide-chevron-down"
      :label="label"
      :class="buttonClass"
      :ui="isBar ? { label: 'truncate', trailingIcon: 'shrink-0' } : undefined"
      :style="isBar ? { color: contrastToPrimary } : undefined"
    />

    <template #item-trailing="{ item }">
      <UIcon
        v-if="item.active"
        name="i-lucide-check"
        class="size-5 shrink-0"
      />
    </template>
  </UDropdownMenu>
</template>

<style scoped></style>
