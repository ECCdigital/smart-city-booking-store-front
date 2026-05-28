<script setup>
import { computed } from "vue";
import { useTenantStore } from "~~/stores/tenant.js";
import { useBreakpointCheck } from "~/composables/utils/useBreakpointCheck.js";
import { useContrastColor } from "~/composables/utils/useContrastColor.js";
import { useTenant } from "~/composables/useTenant";

const { isGreaterThanMd } = useBreakpointCheck();

const t = useI18n().t;

const route = useRoute();
const { tenantID } = useTenant();

const tenantStore = useTenantStore();

const tenants = computed(() => tenantStore.getTenants);

const selectedTenant = computed(() => {
  return tenants.value.find((tenant) => tenant.id === tenantID.value);
});

const selectedTenantLabel = computed(() => {
  return selectedTenant.value?.name ?? t("tenants.selectTenant");
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

const { contrastToPrimary, contrastToSecondary } = useContrastColor();
</script>

<template>
  <UDropdownMenu
      v-if="tenantOptions.length > 0"
    :items="tenantOptions"
    :ui="{
      content:
        'ring-0 shadow-lg glass',
    }"
  >
    <button
      :class="[
        'flex items-center px-4 relative h-12 transition-colors',
        selectedTenant
          ? 'text-[var(--color-on-primary)] bg-[var(--color-primary)]'
          : 'hover:bg-white/10',
      ]"
    >
      <div
        v-if="selectedTenant"
        class="absolute top-0 left-0 w-full h-1 bg-[var(--color-secondary)]/40"
      />
      <UIcon
        name="i-lucide-building-2"
        class="text-lg"
        :class="isGreaterThanMd ? 'mr-2' : ''"
        :style="
          selectedTenant
            ? { color: contrastToPrimary }
            : { color: contrastToSecondary }
        "
      />
      <span
        v-if="isGreaterThanMd"
        class="text-base"
        :style="
          selectedTenant
            ? { color: contrastToPrimary }
            : { color: contrastToSecondary }
        "
      >
        {{ selectedTenantLabel }}
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        size="14"
        class="ml-2"
        :style="
          selectedTenant
            ? { color: contrastToPrimary }
            : { color: contrastToSecondary }
        "
      />
    </button>

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
