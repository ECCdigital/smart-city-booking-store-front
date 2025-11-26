<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";

const t = useI18n().t;

const tenantStore = useTenantStore();

const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenantStore.getCurrentTenant;
});

const selectedTenantLabel = computed(() => {
  return selectedTenant.value?.name ?? t("tenants.selectTenant");
});

const dropdownItems = computed(() => {
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
    }))
  );

  return items;
});

function onSelect(tenant) {
  if (tenant.id === selectedTenant.value?.id) {
    tenantStore.setCurrentTenantID(null);
  } else {
    tenantStore.setCurrentTenantID(tenant.id);
  }
}

function onClear() {
  tenantStore.setCurrentTenantID(null);
}
</script>

<template>
  <UDropdownMenu
    :items="dropdownItems"
    :ui="{
      content:
        'w-(--reka-dropdown-menu-trigger-width) ring-0 shadow-lg bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg',
    }"
  >
    <UButton
      class="w-auto min-w-[180px] bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg"
      color="neutral"
      variant="outline"
    >
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-building" size="24" />
        <div class="flex flex-col items-start leading-tight">
          <span class="text-[10px] uppercase tracking-wide">
            {{ t("tenants.tenant") }}
          </span>

          <span class="text-xs font-semibold leading-tight">
            {{ selectedTenantLabel }}
          </span>
        </div>
      </div>
    </UButton>

    <template #prefix-trailing="{ item }">
      <UIcon
        v-if="selectedTenant?.id === item.id"
        name="i-lucide-check"
        size="16"
        class="text-primary"
      />
    </template>
  </UDropdownMenu>
</template>

<style scoped></style>
