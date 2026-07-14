<template>
  <div
    class="md:basis-1/6 border border-surface rounded mb-5 md:mb-0 m-2 md:m-0 md:p-2 md:space-y-1 flex md:block md:h-64"
  >
    <div
      v-for="(item, i) in items"
      :key="i"
      class="basis-1/2 md:basis-full flex w-full"
    >
      <UTooltip text="Coming soon..." :disabled="!item.disabled">
        <NuxtLink
          class="grid sm:flex rounded p-2 w-full justify-center md:justify-start items-center text-center md:text-left"
          :class="getLinkClasses(item)"
          :to="item.disabled ? '' : tenantTo(item.value)"
        >
          <div class="flex justify-center">
            <UIcon :name="item.icon" class="sm:mr-3 mt-1" />
          </div>
          <div class="text-sm md:text-md mt-1 md:mt-0">{{ item.label }}</div>
        </NuxtLink>
      </UTooltip>
    </div>
  </div>
</template>

<script setup>
defineProps({
  items: {
    type: Array,
    required: true,
  },
});

const { tenantTo, isActivePath } = useTenantRoute();

const inactiveLinkStyle =
  "bg-surface-muted hover:bg-gray-200 dark:hover:bg-neutral-700";
const disabledLinkStyle =
  "cursor-not-allowed opacity-75 bg-surface-muted";
const activeLinkStyle = "bg-primary/20 hover:bg-primary/40 font-semibold";

function getLinkClasses(item) {
  if (item.disabled) return disabledLinkStyle;
  if (isActivePath(item.value)) return activeLinkStyle;
  return inactiveLinkStyle;
}
</script>
