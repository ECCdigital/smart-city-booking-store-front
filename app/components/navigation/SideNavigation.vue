<template>
  <div class="relative">
    <div
      ref="scrollContainer"
      class="overflow-x-auto overflow-y-hidden md:overflow-auto md:basis-1/6 border border-gray-200 rounded mb-5 md:mb-0 mx-2 md:m-0 md:p-2 md:space-y-1 flex md:block md:h-80"
      :class="scrollPaddingClass"
      @scroll="updateScrollHints"
    >
      <div
        v-for="(item, i) in items"
        :key="i"
        class="basis-1/2 md:basis-full flex w-full"
      >
        <div
          v-if="!item.value"
          class="hidden md:block font-bold cursor-default"
          :class="i > 0 ? 'mt-2' : ''"
        >
          {{ item.label }}
        </div>
        <UTooltip v-else text="Coming soon..." :disabled="!item.disabled">
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

    <div
      v-if="showLeftHint"
      class="md:hidden pointer-events-none absolute left-0 top-0 bottom-0 flex items-center pl-2"
    >
      <UIcon name="i-heroicons-chevron-left-20-solid" class="text-gray-400" />
    </div>
    <div
      v-if="showRightHint"
      class="md:hidden pointer-events-none absolute right-0 top-0 bottom-0 flex items-center pr-2"
    >
      <UIcon name="i-heroicons-chevron-right-20-solid" class="text-gray-400" />
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
  "bg-gray-100 dark:bg-gray-900 hover:bg-gray-200 hover:dark:bg-gray-800";
const disabledLinkStyle =
  "cursor-not-allowed opacity-75 bg-gray-100 dark:bg-gray-900";
const activeLinkStyle = "bg-primary/20 hover:bg-primary/40 font-semibold";

const scrollContainer = ref(null);
const showLeftHint = ref(false);
const showRightHint = ref(false);

const scrollPaddingClass = computed(() => ({
  "pl-6": showLeftHint.value,
  "pr-6": showRightHint.value,
}));

function updateScrollHints() {
  const element = scrollContainer.value;
  if (!element) return;

  const maxScrollLeft = element.scrollWidth - element.clientWidth;
  showLeftHint.value = element.scrollLeft > 8;
  showRightHint.value = element.scrollLeft < maxScrollLeft - 8;
}

function onResize() {
  updateScrollHints();
}

onMounted(() => {
  nextTick(updateScrollHints);
  window.addEventListener("resize", onResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", onResize);
});

function getLinkClasses(item) {
  if (item.disabled) return disabledLinkStyle;
  if (isActivePath(item.value)) return activeLinkStyle;
  return inactiveLinkStyle;
}
</script>
