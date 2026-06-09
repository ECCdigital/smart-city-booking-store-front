<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <div v-if="hasCoordinates" class="mb-2">
      <AddressMap :coordinates="item.location.coordinates" />
    </div>
    <div v-else-if="hasAddressString" class="mb-2">
      <AddressMap :address-string="adressString" />
    </div>
    <div v-else />

    <EventsEventAdressInformation
      v-if="props.isEvent"
      :event="item"
      enable-copy-button
    />
    <BookablesBookableAdressInformation
      v-else
      :bookable="item"
      enable-copy-button
    />
  </div>
</template>
<script setup>
import AddressMap from "~/components/AddressMap.vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  isEvent: {
    type: Boolean,
    default: false,
  },
});

const hasCoordinates = computed(() => {
  const points = props.item.location?.coordinates?.points;
  return (
    Array.isArray(points) &&
    points[0] != null &&
    points[1] != null
  );
});
const hasAddressString = computed(() => {
  return !!props.item.location?.display_address;
});
const adressString = computed(() => {
  return props.item.location?.display_address || "";
});
</script>
<style scoped></style>
