<template>
<div>
  <p>
    <UIcon name="i-lucide-map-pin" class="size-5" />
    <span v-if="props.bookable.location" class="p-3">{{
        bookable.location
      }}</span>
    <span v-else class="italic p-3">Keine Adresse bekannt.</span>
  </p>
  <p v-if="props.bookable.location">
    <UIcon name="i-lucide-navigation" class="size-5" />
    <span class="p-3">Distance coming soon </span>
  </p>
</div>
</template>
<script setup>
const props = defineProps({
  bookable: {
    type: Object,
    required: true,
  },
});
</script>


<style scoped>

</style>