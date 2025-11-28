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
    <slot />
  </div>
</template>

<style scoped></style>
