<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useTenant } from "~/composables/useTenant";

const t = useI18n().t;

const route = useRoute();
const { tenantID } = useTenant();

const tenantStore = useTenantStore();
const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenants.value.find((tenant) => tenant.id === tenantID.value);
});
const selectedTenantLabel = computed(() => {
  return selectedTenant.value?.name ?? "Mandant...";
});

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

const { contrastToSecondary } = useContrastColor();
const nameColor = computed(() => {
  if (contrastToSecondary.value === "#ffffff") {
    return "text-white hidden md:inline";
  } else {
    return "text-black hidden md:inline";
  }
});
</script>

<template>
  <div
    v-if="selectedTenant"
    class="absolute top-0 left-0 w-full h-1 bg-secondary/40"
  />
  <UDropdownMenu
    v-if="tenantOptions.length > 0"
    size="lg"
    :items="tenantOptions"
    :ui="{
      content: 'ring-0 shadow-lg glass',
      itemLeadingIcon: 'mt-1',
      item: ' before:bg-transparent data-highlighted:before:bg-transparent',
    }"
    class="pr-0 md:pr-1 md:pl-2 h-12"
    :class="[
      'transition-colors',
      selectedTenant
        ? 'rounded-none text-(--color-on-primary) bg-(--color-primary)'
        : '',
    ]"
  >
    <UButton
      variant="ghost"
      class="flex items-center gap-0 md:gap-2 outline-none cursor-pointer"
    >
      <UUser
        :name="selectedTenantLabel"
        :avatar="{
          icon: 'i-lucide-building-2',
        }"
        :ui="{
          base: 'transition-none',
          avatar: {
            size: 'h-8 w-8',
          },
          name: nameColor,
        }"
        class="mr-0"
      />
      <UIcon
        name="i-lucide-chevron-down"
        :class="nameColor"
        class="mr-1 md:mr-0"
      />
    </UButton>
  </UDropdownMenu>
</template>

<style scoped></style>
