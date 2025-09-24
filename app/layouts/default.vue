<script setup>

useHead({
  link: [
    {
      rel: "stylesheet",
      href: `/api/theme/css`,
    },
  ],
});

</script>

<template>
  <div>
    <UColorModeButton class="absolute right-1" size="xl" />
    <slot />
  </div>
</template>

<style scoped></style>
