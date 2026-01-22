<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";

const { isGreaterThanMd } = useBreakpointCheck();

const t = useI18n().t;

const route = useRoute();

const tenantID = useState("tenantID");

const tenantStore = useTenantStore();

const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenants.value.find((tenant) => tenant.id === tenantID.value);
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
</script>

<template>
  <UDropdownMenu
    :items="dropdownItems"
    :ui="{
      content:
        'ring-0 shadow-lg bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg',
    }"
  >
    <UChip :show="!isGreaterThanMd && !!selectedTenant" inset>
      <UButton
        class="w-auto md:min-w-[150px] bg-white/30 dark:bg-gray-900/40 backdrop-blur-lg"
        color="neutral"
        variant="outline"
      >
        <div class="flex items-center gap-2">
          <UIcon name="i-lucide-building" size="24" />
          <div class="hidden md:block">
            <div class="flex flex-col items-start leading-tight">
              <span class="text-[10px] uppercase tracking-wide">
                {{ t("tenants.tenant") }}
              </span>

              <span class="text-xs font-semibold leading-tight">
                {{ selectedTenantLabel }}
              </span>
            </div>
          </div>
        </div>
      </UButton>
    </UChip>

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
