<script setup lang="ts">

</script>

<template>
  <div class="bg-neutral-50 dark:bg-gray-950">
    <NavigationBar />
    <div
        class=" sm:container-md md:container md:flex h-min-[60vh] w-full md:mx-auto pt-2 md:pt-7"
    >
      <slot />
      </div>
  </div>
</template>

<style scoped>

</style>