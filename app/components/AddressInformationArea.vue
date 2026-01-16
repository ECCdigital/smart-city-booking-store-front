<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <div v-if="hasCoordinates" class="mb-2">
      <AddressMap :coordinates="item.location.coordinates" />
    </div>
    <div v-else-if="hasAddressString" class="mb-2">
      <AddressMap :address-string="adressString" />
    </div>
    <div v-else />

    <EventsEventAdressInformation v-if="props.isEvent" :event="item" />
    <BookablesBookableAdressInformation v-else :bookable="item" class="bg-red-200"/>
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
  return (
    !!props.item.location?.coordinates &&
    !!props.item.location.coordinates.points[0] &&
    !!props.item.location.coordinates.points[1]
  );
});
const hasAddressString = computed(() => {
  if (props.isEvent) {
    return !!props.item.eventAddress?.city;
  }
  return !!props.item.location?.display_address;
});
const adressString = computed(() => {
  if(props.isEvent) {
    const address = props.item.eventAddress
    return `${address.street || ""} ${address.houseNumber || ""}, ${address.zip || ""} ${address.city || ""}`.trim()
  } else {
    return props.item.location?.display_address || ""
  }
})
</script>
<style scoped></style>
