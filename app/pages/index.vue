<template>
  <div class="bg-white dark:bg-gray-900">
    <div class="flex justify-center">
      <SearchBar />
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: "entry",
  middleware: ["catalog-auth"],
});

</script>

<style scoped></style>
