<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";

const tenantStore = useTenantStore();

const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenantStore.getCurrentTenant;
});

const selectedTenantLabel = computed(() => {
  return selectedTenant.value?.name ?? "Mandant auswählen";
});

const dropdownItems = computed(() =>
  tenants.value.map((tenant) => ({
    label: tenant.name,
    id: tenant.id,
    onSelect: () => onSelect(tenant),
    slot: "prefix",
  }))
);

function onSelect(tenant) {
  tenantStore.setCurrentTenantID(tenant.id);
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
          <span class="text-[10px] uppercase tracking-wide"> Mandant </span>

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
