<template>
  <div
    class="flex flex-col cursor-pointer border bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 my-1 md:my-2 hover:shadow-lg transition-shadow border-gray-200 dark:border-gray-700"
    @click="goTo()"
  >
    <!-- title and booking-id -->
    <div class="flex items-center justify-between mb-3 h-1/3">
      <div class="flex items-center space-x-2">
        <UIcon :name="icon" class="w-4 h-4" />
        <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-2">
          {{ title }}
        </h3>
      </div>
      <Icon
        name="i-lucide-arrow-right"
        class="h-5 w-5 block md:hidden text-primary"
      />
    </div>

    <div class="mt-1 text-sm text-gray-500 dark:text-gray-400">
      {{ description }}
    </div>

    <div class="justify-end text-primary hidden md:flex">
      <Icon name="i-lucide-arrow-right" class="h-5 w-5" />
    </div>
  </div>
</template>
<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    default: "",
  },
  icon: {
    type: String,
    default: "",
  },
  to: {
    type: String,
    required: true,
  },
});

const { tenantTo } = useTenantRoute();

function goTo() {
  console.log("goTo", props.to);
  const router = useRouter();
  router.push(tenantTo(props.to));
}
</script>
