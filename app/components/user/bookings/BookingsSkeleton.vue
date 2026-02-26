<template>
  <div class="w-full">
    <div class="flex justify-end items-center w-full mb-4">
      <div class="w-full md:w-[40%] flex">
        <USkeleton class="h-10 flex-1" />
        <USkeleton class="h-10 w-10" />
      </div>
    </div>
    <div
        class="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
    >
      <USkeleton
          v-for="i in skeletonCount"
          :key="i"
          class="h-64 w-full rounded-lg"
      />
    </div>
  </div>
</template>

<script setup>
defineProps({
  skeletonCount: {
    type: Number,
    default: 6,
  },
});
</script>