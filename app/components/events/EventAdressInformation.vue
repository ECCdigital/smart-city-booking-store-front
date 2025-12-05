<template>
  <div>
    <p>
      <UIcon name="i-lucide-map-pin" class="size-5" />
      <span v-if="hasAdress" class="p-3">
        {{ displayAddress() }}
      </span>
      <span v-else class="italic p-3">Keine Adresse bekannt.</span>
    </p>
    <!--
    <p v-if="hasAdress">
      <UIcon name="i-lucide-navigation" class="size-5" />
      <span class="p-3">Distance coming soon </span>
    </p>
    -->
  </div>
</template>
<script setup>
const props = defineProps({
  event: {
    type: Object,
    required: true,
  },
});
const hasAdress = computed(() => {
  return !Object.values(props.event.eventAddress).every(
    (value) => value === null || value === undefined || value === "",
  );
});

const displayAddress = () => {
  return (
    props.event.eventAddress.street +
    " " +
    props.event.eventAddress.houseNumber +
    ", " +
    props.event.eventAddress.zip +
    " " +
    props.event.eventAddress.city
  );
};
</script>

<style scoped></style>
