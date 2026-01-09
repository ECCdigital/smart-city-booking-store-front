<template>
<div>
  <p>
    <UIcon name="i-lucide-map-pin" class="size-5" />
    <span v-if="location.length" class="p-3">{{
        location
      }}</span>
    <span v-else class="italic p-3">Keine Adresse bekannt.</span>
  </p>
  <p v-if="location.length">
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

const location = computed(() => {
  if(typeof props.bookable.location === 'string') {
    return props.bookable.location;
  } else if (props.bookable.location && typeof props.bookable.location === 'object') {
    return props.bookable.location.display_address || '';
  } else {
    return '';
  }
});
</script>


<style scoped>

</style>