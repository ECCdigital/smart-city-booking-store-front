<template>
  <div class="bg-gray-200 dark:bg-gray-700 rounded-md p-3">
    <div v-if="hasCoordinates" class="mb-2">
      <AddressMap :coordinates="item.location.coordinates" />
    </div>
    <div
      v-else-if="hasAddressString"
      class="mb-2"
    >
      <AddressMap :address-string="item.location.display_address" />
    </div>
    <div v-else/>

    <EventsEventAdressInformation v-if="props.isEvent" :event="item" />
    <BookablesBookableAdressInformation v-else :bookable="item" />
  </div>
  <div class="bg-pink-200">
    {{ item.location }}
    <hr >
    hasCoordinates: {{hasCoordinates}} ...
    <hr>
    hasAddressString: {{hasAddressString}}
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
  return (
      !!props.item.location?.display_address
  );
});
</script>
<style scoped></style>
